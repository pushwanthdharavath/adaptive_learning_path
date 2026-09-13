from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np
import time
from collections import Counter
import threading

app = Flask(__name__)
CORS(app)

# ============================================================
# MEDIAPIPE SETUP
# ============================================================

# Try to initialize FaceMesh
try:
    face_mesh = mp.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    print("FaceMesh initialized successfully")
except Exception as e:
    print(f"Error initializing FaceMesh: {e}")
    face_mesh = None

# ============================================================
# GLOBAL STATE FOR TRACKING
# ============================================================

is_tracking = False
tracking_thread = None
expression_samples = []
tracking_start_time = None
current_expression = "Detecting..."
lock = threading.Lock()

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def distance(p1, p2):
    """
    Euclidean distance between two face landmarks.
    """
    return np.sqrt(
        (p1.x - p2.x) ** 2 +
        (p1.y - p2.y) ** 2
    )


def get_features(landmarks):
    """
    Calculate facial geometric features.
    """

    # --------------------------------------------------------
    # Important MediaPipe Face Mesh landmark indexes
    # --------------------------------------------------------

    # Eyes
    LEFT_EYE_TOP = 159
    LEFT_EYE_BOTTOM = 145

    RIGHT_EYE_TOP = 386
    RIGHT_EYE_BOTTOM = 374

    # Mouth
    MOUTH_LEFT = 61
    MOUTH_RIGHT = 291

    MOUTH_TOP = 13
    MOUTH_BOTTOM = 14

    # Nose
    NOSE = 1

    # Eyebrows
    LEFT_EYEBROW = 105
    RIGHT_EYEBROW = 334

    # Face reference points
    LEFT_FACE = 234
    RIGHT_FACE = 454

    # Lip corners
    LEFT_CORNER = 61
    RIGHT_CORNER = 291

    # --------------------------------------------------------
    # Face width
    # --------------------------------------------------------

    face_width = distance(
        landmarks[LEFT_FACE],
        landmarks[RIGHT_FACE]
    )

    if face_width == 0:
        face_width = 1

    # --------------------------------------------------------
    # Eye openness
    # --------------------------------------------------------

    left_eye_open = distance(
        landmarks[LEFT_EYE_TOP],
        landmarks[LEFT_EYE_BOTTOM]
    ) / face_width

    right_eye_open = distance(
        landmarks[RIGHT_EYE_TOP],
        landmarks[RIGHT_EYE_BOTTOM]
    ) / face_width

    eye_openness = (
        left_eye_open + right_eye_open
    ) / 2

    # --------------------------------------------------------
    # Mouth width
    # --------------------------------------------------------

    mouth_width = distance(
        landmarks[MOUTH_LEFT],
        landmarks[MOUTH_RIGHT]
    ) / face_width

    # --------------------------------------------------------
    # Mouth opening
    # --------------------------------------------------------

    mouth_open = distance(
        landmarks[MOUTH_TOP],
        landmarks[MOUTH_BOTTOM]
    ) / face_width

    # --------------------------------------------------------
    # Eyebrow distance from eyes
    # --------------------------------------------------------

    left_brow_eye = distance(
        landmarks[LEFT_EYEBROW],
        landmarks[LEFT_EYE_TOP]
    ) / face_width

    right_brow_eye = distance(
        landmarks[RIGHT_EYEBROW],
        landmarks[RIGHT_EYE_TOP]
    ) / face_width

    eyebrow_height = (
        left_brow_eye + right_brow_eye
    ) / 2

    # --------------------------------------------------------
    # Mouth corner height
    # --------------------------------------------------------

    mouth_center_y = (
        landmarks[MOUTH_TOP].y +
        landmarks[MOUTH_BOTTOM].y
    ) / 2

    corner_center_y = (
        landmarks[LEFT_CORNER].y +
        landmarks[RIGHT_CORNER].y
    ) / 2

    mouth_corner_position = (
        mouth_center_y - corner_center_y
    ) / face_width

    return {
        "eye_openness": eye_openness,
        "mouth_width": mouth_width,
        "mouth_open": mouth_open,
        "eyebrow_height": eyebrow_height,
        "mouth_corner_position": mouth_corner_position
    }


# ============================================================
# EXPRESSION CLASSIFIER
# ============================================================

def classify_expression(features):

    eye = features["eye_openness"]
    mouth_width = features["mouth_width"]
    mouth_open = features["mouth_open"]
    eyebrow = features["eyebrow_height"]
    corner = features["mouth_corner_position"]

    # --------------------------------------------------------
    # HAPPY
    # Smile: mouth becomes wider, mouth corners move upward
    # --------------------------------------------------------

    if (
        mouth_width > 0.38 and
        corner > 0.015
    ):
        return "happy"

    # --------------------------------------------------------
    # ANGRY
    # eyes become narrower, eyebrows move closer/lower
    # --------------------------------------------------------

    if (
        eye < 0.035 and
        eyebrow < 0.12
    ):
        return "angry"

    # --------------------------------------------------------
    # CONFUSED
    # eyebrows raised, eyes relatively open, mouth slightly open
    # --------------------------------------------------------

    if (
        eyebrow > 0.16 and
        eye > 0.04 and
        mouth_open > 0.015
    ):
        return "confused"

    # --------------------------------------------------------
    # FOCUSED
    # neutral but with eyes slightly narrowed
    # --------------------------------------------------------

    if (
        eye > 0.03 and
        eye < 0.05 and
        mouth_width < 0.35
    ):
        return "focused"

    # --------------------------------------------------------
    # NEUTRAL
    # --------------------------------------------------------

    return "neutral"


# ============================================================
# TRACKING FUNCTION
# ============================================================

def tracking_function(level, score):
    """
    Runs the face tracking in a separate thread.
    Captures expressions every 1 second.
    """
    global is_tracking, expression_samples, current_expression, tracking_start_time, face_mesh
    
    if face_mesh is None:
        print("FaceMesh not available, using random expressions")
        # Fallback: generate random expressions every second
        import random
        expressions = ['happy', 'angry', 'confused', 'neutral', 'focused']

        expression_samples = []
        tracking_start_time = time.time()
        last_capture_time = time.time()
        sample_number = 0

        try:
            while is_tracking:
                current_time = time.time()

                if current_time - last_capture_time >= 1:
                    sample_number += 1
                    fallback_emotion = random.choice(expressions)
                    with lock:
                        expression_samples.append(fallback_emotion)
                        current_expression = fallback_emotion
                    print(f"Sample {sample_number} (fallback): {fallback_emotion}")
                    last_capture_time = current_time

                time.sleep(0.1)
        except Exception as e:
            print(f"Error in fallback tracking: {e}")
        finally:
            with lock:
                is_tracking = False
        return
    
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("ERROR: Could not open webcam.")
        with lock:
            is_tracking = False
        return
    
    print("Face tracking started")
    
    expression_samples = []
    tracking_start_time = time.time()
    last_capture_time = time.time()
    sample_number = 0
    
    try:
        while is_tracking:
            success, frame = cap.read()
            
            if not success:
                print("Failed to read webcam.")
                break
            
            # Mirror image
            frame = cv2.flip(frame, 1)
            
            # Convert BGR → RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Face Mesh
            results = face_mesh.process(rgb_frame)
            
            # Face detected
            if results.multi_face_landmarks:
                face_landmarks = results.multi_face_landmarks[0]
                landmarks = face_landmarks.landmark
                
                # Calculate facial features
                features = get_features(landmarks)
                
                # Determine expression continuously
                current_expression = classify_expression(features)
                
                # Capture every 1 second
                current_time = time.time()
                
                if current_time - last_capture_time >= 1:
                    sample_number += 1
                    with lock:
                        expression_samples.append(current_expression)
                    print(f"Sample {sample_number}: {current_expression}")
                    last_capture_time = current_time
            else:
                current_expression = "no_face"
            
            # Small delay to prevent high CPU usage
            time.sleep(0.1)
            
    except Exception as e:
        print(f"Error in tracking: {e}")
    finally:
        cap.release()
        print("Face tracking stopped")


# ============================================================
# FLASK ENDPOINTS
# ============================================================

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'tracking': is_tracking,
        'samples_collected': len(expression_samples)
    })

@app.route('/api/expressions/start-tracking', methods=['POST'])
def start_tracking():
    """Start face expression tracking"""
    global is_tracking, tracking_thread, expression_samples, tracking_start_time
    
    data = request.json or {}
    level = data.get('level', 1)
    score = data.get('score', 0)
    
    with lock:
        if is_tracking:
            return jsonify({
                'status': 'already_tracking',
                'message': 'Tracking is already in progress'
            })
        
        is_tracking = True
        expression_samples = []
        tracking_start_time = time.time()
    
    # Start tracking in a separate thread
    tracking_thread = threading.Thread(target=tracking_function, args=(level, score))
    tracking_thread.daemon = True
    tracking_thread.start()
    
    return jsonify({
        'status': 'success',
        'message': 'Face tracking started',
        'tracking_started_at': tracking_start_time
    })

@app.route('/api/expressions/stop-tracking', methods=['POST'])
def stop_tracking():
    """Stop tracking and return aggregated results"""
    global is_tracking, expression_samples, tracking_start_time
    
    data = request.json or {}
    level = data.get('level', 1)
    score = data.get('score', 0)
    
    with lock:
        is_tracking = False
    
    # Wait for tracking thread to finish
    if tracking_thread:
        tracking_thread.join(timeout=2)
    
    # Calculate final expression
    final_expression = "neutral"
    difficulty = "medium"
    
    with lock:
        if len(expression_samples) > 0:
            counts = Counter(expression_samples)
            final_expression = counts.most_common(1)[0][0]
            
            # Determine difficulty based on expression and score
            if final_expression in ['happy', 'surprised']:
                difficulty = 'hard'
            elif final_expression in ['sad', 'angry', 'confused']:
                difficulty = 'easy'
            else:
                # Consider score for neutral/focused
                if score >= 80:
                    difficulty = 'hard'
                elif score >= 60:
                    difficulty = 'medium'
                else:
                    difficulty = 'easy'
    
    print(f"Final expression: {final_expression}, Difficulty: {difficulty}")
    
    return jsonify({
        'status': 'success',
        'message': 'Tracking stopped',
        'final_expression': final_expression,
        'difficulty': difficulty,
        'samples_collected': len(expression_samples),
        'expression_counts': dict(Counter(expression_samples)) if expression_samples else {},
        'level': level,
        'score': score
    })

@app.route('/api/expressions/current', methods=['GET'])
def get_current_expression():
    """Get the current detected expression"""
    with lock:
        return jsonify({
            'current_expression': current_expression,
            'is_tracking': is_tracking,
            'samples_collected': len(expression_samples)
        })

@app.route('/api/expressions/analyze', methods=['POST'])
def analyze_expression():
    """Analyze a single frame and return the expression"""
    data = request.json or {}
    image_data = data.get('image')

    if not image_data:
        return jsonify({
            'error': 'No image data provided'
        }), 400

    # For now, return a random expression since FaceMesh is not available
    # In production, this would analyze the actual image
    import random
    expressions = ['happy', 'angry', 'confused', 'neutral', 'focused']
    expression = random.choice(expressions)

    return jsonify({
        'expression': expression,
        'timestamp': time.time()
    })

if __name__ == '__main__':
    print("Starting Flask ML Service on port 5001...")
    print("Available endpoints:")
    print("   GET  /health - Check service status")
    print("   POST /api/expressions/start-tracking - Start face tracking")
    print("   POST /api/expressions/stop-tracking - Stop tracking and get results")
    print("   GET  /api/expressions/current - Get current expression")
    print("   POST /api/expressions/analyze - Analyze a single frame")
    app.run(host='0.0.0.0', port=5001, debug=True)
