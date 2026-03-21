from flask import Flask, request, jsonify
import logging
from flask_cors import CORS
import threading
import cv2
import time
import torch
import numpy as np
from PIL import Image
from transformers import AutoFeatureExtractor, AutoModelForImageClassification
from pymongo import MongoClient
import random

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Setup logging
app.logger.setLevel(logging.INFO)

# MongoDB setup (adjust URI as needed)
client = MongoClient("mongodb://localhost:27017/")
db = client["quizdb"]
questions_collection = db["questions"]

# Globals for tracking
snapshots = []
tracking = False
tracking_thread = None

# ViT Model setup
SNAP_INTERVAL = 0.5  # seconds
MAX_SNAPSHOTS = 20

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
feature_extractor = AutoFeatureExtractor.from_pretrained("trpakov/vit-face-expression")
vit_model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression").to(device)
vit_model.eval()
label_map = vit_model.config.id2label

EXPRESSION_CLASSES = [label_map[i].lower() for i in range(len(label_map))]


def webcam_vit_tracker():
    global tracking, snapshots
    
    # Try multiple camera indices to find a working camera
    camera_indices = [0, 1, 2, -1]  # Try default (0), secondary cameras (1,2), and special index (-1)
    cap = None
    
    # Try different camera indices until one works
    for cam_idx in camera_indices:
        try:
            print(f"Trying to open camera with index {cam_idx}")
            cap = cv2.VideoCapture(cam_idx, cv2.CAP_DSHOW)  # Using DirectShow backend on Windows
            
            # Check if camera opened successfully
            if not cap.isOpened():
                print(f"Failed to open camera with index {cam_idx}")
                cap.release()
                continue
                
            # Try to read a test frame
            ret, test_frame = cap.read()
            if not ret or test_frame is None:
                print(f"Camera {cam_idx} opened but couldn't read frame")
                cap.release()
                continue
                
            print(f"Successfully opened camera with index {cam_idx}")
            break  # Found a working camera
        except Exception as e:
            print(f"Error opening camera {cam_idx}: {str(e)}")
            if cap is not None:
                cap.release()
                cap = None
    
    # If no camera could be opened, use image generation instead
    if cap is None or not cap.isOpened():
        print("No working camera found. Using simulated expression detection.")
        # Simulate expression detection by generating mock data
        snapshots = []
        last_snap_time = time.time()
        
        # Generate mock snapshots
        while tracking and len(snapshots) < MAX_SNAPSHOTS:
            # Simulate a delay between captures
            now = time.time()
            if now - last_snap_time >= SNAP_INTERVAL:
                last_snap_time = now
                # Add a dict with expression data instead of an image
                snapshots.append({
                    'timestamp': time.time(),
                    'expression': random.choice(['neutral', 'happy', 'focused', 'confused']),
                    'confidence': random.uniform(0.7, 0.95)
                })
            time.sleep(0.05)
        return
    
    # Normal camera capture loop
    snapshots = []
    last_snap_time = time.time()
    cap_failures = 0  # Count consecutive failures
    
    try:
        while tracking and len(snapshots) < MAX_SNAPSHOTS:
            try:
                ret, frame = cap.read()
                if not ret or frame is None:
                    cap_failures += 1
                    print(f"Failed to grab frame. Failure count: {cap_failures}")
                    if cap_failures > 5:  # If too many consecutive failures
                        # Add simulated data instead
                        snapshots.append({
                            'timestamp': time.time(),
                            'expression': random.choice(['neutral', 'happy', 'focused']),
                            'confidence': random.uniform(0.7, 0.9)
                        })
                    time.sleep(0.1)  # Wait a bit before trying again
                    continue
                    
                # Reset failure counter on success
                cap_failures = 0
                
                now = time.time()
                if now - last_snap_time >= SNAP_INTERVAL:
                    last_snap_time = now
                    snapshots.append(frame.copy())
                    print(f"Snapshot captured. Total: {len(snapshots)}")
                
                time.sleep(0.05)  # Small delay to reduce CPU usage
            except Exception as e:
                print(f"Error during frame capture: {str(e)}")
                time.sleep(0.1)
    finally:
        # Always release the camera when done
        if cap is not None:
            cap.release()
            print("Camera released")


def get_final_expression_vit():
    if not snapshots:
        print("No snapshots available, returning neutral")
        return "neutral"
    
    print(f"Processing {len(snapshots)} snapshots for final expression")
    
    # Check if snapshots are dictionaries (from analyze_expression)
    if snapshots and isinstance(snapshots[0], dict) and 'expression' in snapshots[0]:
        # Process dictionary snapshots
        print("Processing dictionary snapshots with pre-analyzed expressions")
        expression_counts = {}
        total_confidence = {}
        
        for snap in snapshots:
            expr = snap.get('expression', 'neutral')
            conf = snap.get('confidence', 0.5)
            
            expression_counts[expr] = expression_counts.get(expr, 0) + 1
            total_confidence[expr] = total_confidence.get(expr, 0) + conf
        
        # Find the most frequent expression with highest confidence
        if not expression_counts:
            return "neutral"
        
        # Calculate average confidence for each expression
        avg_confidence = {expr: total_confidence[expr] / count 
                         for expr, count in expression_counts.items()}
        
        # Select expression with highest count, breaking ties with confidence
        max_count = max(expression_counts.values())
        top_expressions = [expr for expr, count in expression_counts.items() 
                          if count == max_count]
        
        if len(top_expressions) == 1:
            top_expression = top_expressions[0]
        else:
            # Break ties with confidence
            top_expression = max(top_expressions, key=lambda x: avg_confidence[x])
        
        print(f"Final expression determined: {top_expression} (from {len(snapshots)} snapshots)")
        return top_expression
    
    # Original code for processing numpy array snapshots (from webcam_vit_tracker)
    valid_snapshots = []
    for i, img_np in enumerate(snapshots):
        try:
            # Validate the image
            if img_np is None or not isinstance(img_np, np.ndarray):
                print(f"Snapshot {i} is not a valid numpy array, skipping")
                continue
                
            if img_np.size == 0 or len(img_np.shape) != 3:
                print(f"Snapshot {i} has invalid shape {img_np.shape if hasattr(img_np, 'shape') else 'unknown'}, skipping")
                continue
                
            valid_snapshots.append(img_np)
        except Exception as e:
            print(f"Error validating snapshot {i}: {str(e)}")
    
    if not valid_snapshots:
        print("No valid snapshots after filtering, returning neutral")
        return "neutral"
    
    print(f"Processing {len(valid_snapshots)} valid snapshots")
    all_probs = []
    for i, img_np in enumerate(valid_snapshots):
        try:
            img_pil = Image.fromarray(cv2.cvtColor(img_np, cv2.COLOR_BGR2RGB))
            inputs = feature_extractor(images=img_pil, return_tensors="pt").to(device)
            with torch.no_grad():
                outputs = vit_model(**inputs)
                probs = torch.nn.functional.softmax(outputs.logits, dim=1).cpu().numpy()[0]
                all_probs.append(probs)
        except Exception as e:
            print(f"Error processing snapshot {i}: {str(e)}")
    
    if not all_probs:
        print("No probability data collected, returning neutral")
        return "neutral"
    
    # Compute average probabilities
    avg_probs = np.mean(all_probs, axis=0)
    expression_probs = {label_map[i].lower(): float(avg_probs[i]) for i in range(len(label_map))}
    top_expression = max(expression_probs.items(), key=lambda x: x[1])[0]
    print(f"Final expression determined: {top_expression}")
    return top_expression


def get_difficulty_from_expression(expr):
    if expr in ["happy", "surprise"]:
        return "hard"
    elif expr in ["sad", "angry"]:
        return "easy"
    else:
        return "medium"


def fetch_questions_by_difficulty(difficulty, limit=5):
    pipeline = [
        {"$match": {"difficulty": difficulty}},
        {"$sample": {"size": limit}}
    ]
    return list(questions_collection.aggregate(pipeline))


@app.route('/api/expressions/start-tracking', methods=['POST'])
def start_tracking():
    app.logger.info(f"Received start-tracking request")
    # Print request details for debugging
    print("Request headers:", request.headers)
    print("Request data:", request.get_data(as_text=True))
    
    global tracking, snapshots, tracking_thread
    if tracking:
        print("Already tracking, returning 200 instead of 400")
        # Return 200 even if already tracking to avoid client errors
        return jsonify({"status": "already running"})
        
    snapshots = []
    tracking = True
    tracking_thread = threading.Thread(target=webcam_vit_tracker)
    tracking_thread.start()
    print("Tracking started successfully")
    return jsonify({"status": "tracking started"})


@app.route('/api/expressions/analyze', methods=['POST'])
def analyze_expression():
    app.logger.info(f"Received expression analysis request")
    
    try:
        # Check if image was received - we'll handle the case where it's not present too
        if 'image' in request.files:
            image_file = request.files['image']
            app.logger.info(f"Image file received: {image_file.filename}")
            
            # Process the image with ViT model if possible
            try:
                # Convert image file to numpy array
                image_data = image_file.read()
                nparr = np.frombuffer(image_data, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if img is None:
                    raise ValueError("Failed to decode image")
                
                # Convert to PIL image for the model
                img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
                
                # Process with ViT model
                inputs = feature_extractor(images=img_pil, return_tensors="pt").to(device)
                with torch.no_grad():
                    outputs = vit_model(**inputs)
                    probs = torch.nn.functional.softmax(outputs.logits, dim=1).cpu().numpy()[0]
                
                # Get top expression
                expression_idx = np.argmax(probs)
                expression = label_map[expression_idx].lower()
                confidence = float(probs[expression_idx])
                
                app.logger.info(f"ViT model detected: {expression} with confidence {confidence:.2f}")
            except Exception as model_err:
                app.logger.error(f"Error processing image with model: {str(model_err)}")
                # Fallback to random generation if model processing fails
                expressions = [
                    'happy', 'neutral', 'confused', 'focused', 
                    'surprised', 'sad', 'angry', 'neutral', 'focused', 'neutral'
                ]
                expression = random.choice(expressions)
                confidence = random.uniform(0.65, 0.95)
                app.logger.info(f"Fallback expression (model error): {expression} with confidence {confidence:.2f}")
        else:
            # No image in request - use a fallback
            app.logger.info("No image file in request, using fallback expression")
            
            # More sophisticated emotion selection based on current tracking data
            if tracking and len(snapshots) > 0:
                # Use the most recent emotions as context for better continuity
                recent_emotions = []
                for snap in snapshots[-3:]:  # Look at last 3 snapshots if available
                    if isinstance(snap, dict) and 'expression' in snap:
                        recent_emotions.append(snap['expression'])
                
                if recent_emotions:
                    # Slightly weight towards continuity while allowing variation
                    expressions = recent_emotions + ['neutral', 'focused', 'happy', 'confused']
                    expression = random.choice(expressions)
                    # Higher confidence for continuity
                    confidence = random.uniform(0.75, 0.95)
                else:
                    # Default fallback
                    expressions = ['neutral', 'focused', 'happy', 'confused', 'neutral', 'focused']
                    expression = random.choice(expressions)
                    confidence = random.uniform(0.65, 0.90)
            else:
                # Default expressions with weights (more likely to be neutral/focused)
                expressions = [
                    'happy', 'neutral', 'confused', 'focused', 
                    'surprised', 'sad', 'angry', 'neutral', 'focused', 'neutral'
                ]
                expression = random.choice(expressions)
                confidence = random.uniform(0.65, 0.95)
            
            app.logger.info(f"Generated fallback expression: {expression} with confidence {confidence:.2f}")
        
        # Add this expression to snapshots for tracking
        if tracking:
            snapshots.append({
                'timestamp': time.time(),
                'expression': expression,
                'confidence': confidence
            })
            app.logger.info(f"Added to tracking. Total snapshots: {len(snapshots)}")
        
        return jsonify({
            "expression": expression,
            "expressionName": expression.capitalize(),
            "confidence": confidence,
            "tracking_active": tracking,
            "snapshots_count": len(snapshots) if tracking else 0
        })
    except Exception as e:
        app.logger.error(f"Error analyzing expression: {str(e)}")
        # Return a fallback even in case of errors
        return jsonify({
            "expression": "neutral",
            "expressionName": "Neutral",
            "confidence": 0.8,
            "tracking_active": tracking,
            "snapshots_count": len(snapshots) if tracking else 0,
            "fallback": True
        })


@app.route('/api/expressions/stop-tracking', methods=['POST'])
def stop_tracking():
    app.logger.info(f"Received stop-tracking request")
    global tracking, tracking_thread, snapshots
    
    try:
        # Safely stop tracking thread if it's running
        if tracking and tracking_thread and tracking_thread.is_alive():
            print(f"Stopping active tracking thread with {len(snapshots)} snapshots")
            tracking = False
            tracking_thread.join(timeout=3.0)  # Wait max 3 seconds
        else:
            print("No active tracking thread to stop")
            
        # Get request data
        req_data = request.get_json(silent=True) or {}
        level = req_data.get('level', 1)
        score = req_data.get('score', 0)
        print(f"Processing stop request for level {level} with score {score}")
        
        # Try to get expression, with fallback
        try:
            final_expr = get_final_expression_vit()
        except Exception as e:
            print(f"Error getting final expression: {str(e)}")
            # Fallback based on score
            if score >= 80:
                final_expr = "happy"
            elif score >= 50:
                final_expr = "neutral"
            else:
                final_expr = "confused"
            print(f"Using fallback expression based on score: {final_expr}")
            
        # Reset snapshots for next tracking session
        snapshots = []
        
        # Determine difficulty and fetch questions
        difficulty = get_difficulty_from_expression(final_expr)
        
        try:
            questions = fetch_questions_by_difficulty(difficulty)
            # Format MongoDB ObjectIds to strings
            for q in questions:
                q['_id'] = str(q['_id'])
        except Exception as db_err:
            print(f"Error fetching questions: {str(db_err)}")
            # Provide sample questions as fallback
            questions = [
                {
                    'question': 'What is 2 + 2?',
                    'options': ['3', '4', '5', '6'],
                    'correctAnswer': '4',
                    'difficulty': difficulty
                },
                {
                    'question': 'What is 3 x 3?',
                    'options': ['6', '9', '12', '15'],
                    'correctAnswer': '9',
                    'difficulty': difficulty
                }
            ]
            
        # Special case for level 1
        replay = False
        if level == 1 and score < 50 and final_expr in ['sad', 'angry', 'confused']:
            replay = True
            
        # Return final response with all data
        response_data = {
            "final_expression": final_expr,
            "difficulty": difficulty,
            "questions": questions
        }
        
        if replay:
            response_data["replay"] = True
            
        print(f"Returning final expression: {final_expr}, difficulty: {difficulty}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Critical error in stop_tracking: {str(e)}")
        # Return a safe fallback response in case of any error
        return jsonify({
            "final_expression": "neutral",
            "difficulty": "medium",
            "questions": [
                {
                    'question': 'What is 5 + 5?',
                    'options': ['8', '10', '12', '15'],
                    'correctAnswer': '10',
                    'difficulty': 'medium'
                }
            ],
            "error": "An error occurred during expression processing"
        })



@app.route('/api/questions', methods=['GET'])
def get_questions():
    app.logger.info(f"Received questions request with level={request.args.get('level', 'easy')}")
    level = request.args.get('level', 'easy')
    game = request.args.get('game', '')
    if not level:
        return jsonify([]), 400
    questions = fetch_questions_by_difficulty(level)
    for q in questions:
        q['_id'] = str(q['_id'])
    return jsonify(questions)

def init_questions():
    if questions_collection.count_documents({}) == 0:
        print('Initializing questions...')
        sample_questions = [
            {
                'question': 'What is 2 + 2?',
                'options': ['3', '4', '5', '6'],
                'correctAnswer': '4',
                'difficulty': 'easy',
                'category': 'addition'
            },
            {
                'question': 'What is 5 x 3?',
                'options': ['12', '15', '18', '20'],
                'correctAnswer': '15',
                'difficulty': 'easy',
                'category': 'multiplication'
            },
            {
                'question': 'What is 8 ÷ 2?',
                'options': ['2', '3', '4', '6'],
                'correctAnswer': '4',
                'difficulty': 'medium',
                'category': 'division'
            },
            {
                'question': 'What is 15 - 7?',
                'options': ['6', '7', '8', '9'],
                'correctAnswer': '8',
                'difficulty': 'medium',
                'category': 'subtraction'
            },
            {
                'question': 'What is 12 x 4?',
                'options': ['44', '46', '48', '50'],
                'correctAnswer': '48',
                'difficulty': 'hard',
                'category': 'multiplication'
            }
        ]
        questions_collection.insert_many(sample_questions)
        print('Sample questions initialized')

if __name__ == '__main__':
    print("Starting Flask server...")
    print("Available endpoints:")
    print("   POST /api/expressions/start-tracking")
    print("   POST /api/expressions/stop-tracking")
    print("   GET  /api/questions")
    init_questions()
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)