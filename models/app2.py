import cv2
import mediapipe as mp
import numpy as np
import time
import threading
import torch
import torch.nn as nn
from tensorflow.keras.models import load_model
import joblib
import requests
from flask import Flask, request, jsonify

# -------------------------------
# Define ALP Model
# -------------------------------
class ALPModel(nn.Module):
    def __init__(self, input_dim=6, hidden_dim=32, output_dim=3, num_levels=5):
        super(ALPModel, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)
        self.fc2 = nn.Linear(hidden_dim, num_levels * output_dim)

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x.view(-1, 5, 3)

# -------------------------------
# Define backend server
# -------------------------------
app = Flask(__name__)

from flask_cors import CORS
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"], supports_credentials=True)

# --- Load models and mediapipe at startup for reuse ---
expression_model = load_model('expression.h5')
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False)

# --- Emotion tracking globals ---
capturing = False
expression_list = []
expression_lock = threading.Lock()
latest_avg_probs = None  # Store latest emotion probabilities for predictions

from werkzeug.utils import secure_filename
import io
from flask import send_file

@app.route('/api/expressions/upload-frame', methods=['POST'])
def upload_frame():
    print('[API] /api/expressions/upload-frame called')
    if 'frame' not in request.files:
        print('[ERROR] No frame part in request')
        return jsonify({'status': 'error', 'message': 'No frame part in request'}), 400
    file = request.files['frame']
    if file.filename == '':
        print('[ERROR] No selected file')
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400
    try:
        # Read image file as numpy array
        in_memory_file = io.BytesIO()
        file.save(in_memory_file)
        in_memory_file.seek(0)
        file_bytes = np.frombuffer(in_memory_file.read(), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        print('[DEBUG] Received frame shape:', img.shape if img is not None else None)
        if img is None:
            print('[ERROR] Invalid image data')
            return jsonify({'status': 'error', 'message': 'Invalid image data'}), 400
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(img_rgb)
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            face_points = []
            for lm in landmarks:
                face_points.extend([lm.x, lm.y])
            if len(face_points) != 936:
                print(f'[ERROR] Expected 936 features, got {len(face_points)}')
                return jsonify({'status': 'error', 'message': f'Expected 936 features, got {len(face_points)}'}), 400
            face_points = np.array(face_points).reshape(1, -1)
            face_points = face_points.reshape(1, 936, 1)
            expression_probs = expression_model.predict(face_points, verbose=0)[0]
            with expression_lock:
                expression_list.append(expression_probs.tolist())
                print(f'[DEBUG] Appended expression_probs, expression_list now has {len(expression_list)} items.')
            return jsonify({'status': 'success', 'expression_probs': expression_probs.tolist()})
        else:
            print('[INFO] No face detected in uploaded frame.')
            return jsonify({'status': 'error', 'message': 'No face detected'}), 200
    except Exception as e:
        print(f'[ERROR] Exception in upload_frame: {e}')
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/expressions/start', methods=['POST'])
def start_expression_tracking():
    global capturing, expression_list
    with expression_lock:
        capturing = True
        expression_list = []
    print('[API] Started emotion tracking (capturing=True)')
    print(f'[DEBUG] capturing={capturing}, expression_list cleared.')
    return jsonify({'status': 'started'})

@app.route('/api/expressions/stop', methods=['POST'])
def stop_expression_tracking():
    global capturing, expression_list, latest_avg_probs
    with expression_lock:
        capturing = False
        if expression_list:
            avg_probs = np.mean(expression_list, axis=0)
            latest_avg_probs = avg_probs.tolist()
            print('[API] Stopped emotion tracking. Returning avg_probs:', avg_probs)
            result = {'average_expression_probabilities': latest_avg_probs}
        else:
            print('[API] Stopped emotion tracking. No data collected.')
            latest_avg_probs = None
            result = {'average_expression_probabilities': []}
        expression_list = []
    return jsonify({'status': 'stopped', 'result': result})

@app.route('/api/predictions', methods=['POST'])
def receive_predictions():
    global latest_avg_probs
    data = request.get_json()
    print("[BACKEND] Received data from client:")
    print(data)

    score = data.get("score", 0)

    # Use latest_avg_probs from server memory
    if latest_avg_probs is None or len(latest_avg_probs) != 5:
        print('[BACKEND] No recent emotion data, using zeros.')
        emotion_features = [0, 0, 0, 0, 0]
    else:
        emotion_features = list(latest_avg_probs)

    final_input = [score] + emotion_features
    print(f"[BACKEND] Model input (score + emotion): {final_input}")

    # Process the data using the ALP model
    alp_model = ALPModel()
    alp_model.load_state_dict(torch.load("alp_model_final1.pth"))
    alp_model.eval()

    alp_scaler = joblib.load("alp_scaler.pkl")
    difficulty_mapping_reverse = {0: "easy", 1: "medium", 2: "hard"}

    standardized_input = alp_scaler.transform([final_input])[0]
    standardized_tensor = torch.tensor([standardized_input], dtype=torch.float32)

    with torch.no_grad():
        output = alp_model(standardized_tensor)
        predictions = torch.argmax(output, dim=2).squeeze().tolist()

    predicted_difficulties = [difficulty_mapping_reverse[p] for p in predictions]
    print("[BACKEND] Predicted path:", predicted_difficulties)

    # Return the predicted difficulties
    response = {
        "message": "Data received successfully!",
        "status": "success",
        "predicted_difficulties": predicted_difficulties
    }

    return jsonify(response)

def start_backend():
    app.run(host='0.0.0.0', port=5000)

# -------------------------------
# Main function (captures webcam and sends data to backend)
# -------------------------------
def main():
    global capturing, expression_list
    alp_model = ALPModel()
    alp_model.load_state_dict(torch.load("alp_model_final1.pth"))
    alp_model.eval()

    alp_scaler = joblib.load("alp_scaler.pkl")
    difficulty_mapping_reverse = {0: "easy", 1: "medium", 2: "hard"}

    print("[INFO] Loading expression model...")
    expression_model = load_model('expression.h5')
    print("[INFO] Expression model loaded.")

    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Could not open webcam.")
        exit()

    running = True

    def listen_terminal():
        nonlocal running
        while running:
            user_input = input()
            if user_input.lower() == 'q':
                print("[INFO] 'q' pressed, exiting.")
                running = False
                break

    input_thread = threading.Thread(target=listen_terminal, daemon=True)
    input_thread.start()

    print("[INFO] Webcam ready. Use API to start/stop capturing. Type 'q' in terminal to quit.")

    try:
        while running:
            ret, frame = cap.read()
            if not ret:
                print("[WARNING] Failed to grab frame.")
                continue

            cv2.imshow('Webcam', frame)
            if cv2.waitKey(1) & 0xFF == 27:
                break

            # --- Emotion tracking via API ---
            if capturing:
                print("[INFO] Capturing a snapshot...")
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = face_mesh.process(frame_rgb)

                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0].landmark
                    face_points = []
                    for lm in landmarks:
                        face_points.extend([lm.x, lm.y])

                    if len(face_points) != 936:
                        print(f"[WARNING] Expected 936 features, got {len(face_points)}. Skipping.")
                    else:
                        face_points = np.array(face_points).reshape(1, -1)
                        face_points = face_points.reshape(1, 936, 1)
                        expression_probs = expression_model.predict(face_points, verbose=0)[0]
                        with expression_lock:
                            expression_list.append(expression_probs)
                        print(f"[INFO] Captured probabilities: {np.round(expression_probs, 4)}")
                else:
                    print("[INFO] No face detected in this snapshot.")

                print("[INFO] Waiting 5 seconds before next snapshot...")
                time.sleep(5)

    except KeyboardInterrupt:
        print("[INFO] Interrupted by user, exiting.")

    cap.release()
    cv2.destroyAllWindows()

    # No auto-send to backend, handled via API

# -------------------------------
# Entry point
# -------------------------------
if __name__ == "__main__":
    # Start Flask server on port 5001
    app.run(host="0.0.0.0", port=5001)

