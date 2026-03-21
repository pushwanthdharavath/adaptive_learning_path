import cv2
import mediapipe as mp
import numpy as np
import time
import threading  # ✅ For parallel keyboard input
import torch
import torch.nn as nn
from tensorflow.keras.models import load_model
import joblib
import requests

# -------------------------------
# Define ALP Model
# -------------------------------
class ALPModel(nn.Module):
    def _init_(self, input_dim=6, hidden_dim=32, output_dim=3, num_levels=5):
        super(ALPModel, self)._init_()
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
# Initialize models
# -------------------------------
alp_model = ALPModel()
alp_model.load_state_dict(torch.load("alp_model_final1.pth"))
alp_model.eval()

alp_scaler = joblib.load("alp_scaler.pkl")
difficulty_mapping_reverse = {0: "easy", 1: "medium", 2: "hard"}

print("[INFO] Loading expression model...")
expression_model = load_model('expression.h5')
print("[INFO] Expression model loaded.")

# -------------------------------
# Initialize MediaPipe FaceMesh
# -------------------------------
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False)

# -------------------------------
# Initialize webcam
# -------------------------------
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("[ERROR] Could not open webcam.")
    exit()

expression_list = []
capturing = False
running = True

# -------------------------------
# Thread function to listen for terminal input
# -------------------------------
def listen_terminal():
    global capturing, running
    while running:
        user_input = input()
        if user_input.lower() == 's':
            if not capturing:
                capturing = True
                print("[INFO] Started capturing snapshots every 5 seconds.")
        elif user_input.lower() == 'q':
            print("[INFO] 'q' pressed, exiting.")
            running = False
            break

# Start terminal input thread
input_thread = threading.Thread(target=listen_terminal, daemon=True)
input_thread.start()

print("[INFO] Webcam ready. Type 's' in the terminal to start, 'q' to quit.")

try:
    while running:
        ret, frame = cap.read()
        if not ret:
            print("[WARNING] Failed to grab frame.")
            continue

        cv2.imshow('Webcam', frame)
        if cv2.waitKey(1) & 0xFF == 27:  # ESC can still close the window
            break

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
                    expression_list.append(expression_probs)
                    print(f"[INFO] Captured probabilities: {np.round(expression_probs, 4)}")
            else:
                print("[INFO] No face detected in this snapshot.")

            print("[INFO] Waiting 5 seconds before next snapshot...")
            time.sleep(5)

except KeyboardInterrupt:
    print("[INFO] Interrupted by user, exiting.")

# -------------------------------
# Cleanup
# -------------------------------
cap.release()
cv2.destroyAllWindows()

# -------------------------------
# After exiting: Run ALP on averaged data
# -------------------------------
if expression_list:
    avg_probs = np.mean(expression_list, axis=0)
    print("[INFO] Average expression probabilities across all snapshots:")
    for i, prob in enumerate(avg_probs):
        print(f"Class {i}: {prob:.4f}")

    score = 100  # Hardcoded score
    final_input = np.concatenate(([score], avg_probs))
    formatted_input = [f"{final_input[0]:.1f}"] + [f"{x:.4f}" for x in final_input[1:]]
    print(f"[INFO] Final input to ALP: {formatted_input}")

    standardized_input = alp_scaler.transform([final_input])[0]
    standardized_tensor = torch.tensor([standardized_input], dtype=torch.float32)

    with torch.no_grad():
        output = alp_model(standardized_tensor)
        predictions = torch.argmax(output, dim=2).squeeze().tolist()

    predicted_difficulties = [difficulty_mapping_reverse[p] for p in predictions]
    print(f"[INFO] Final Predicted difficulty levels: {predicted_difficulties}")

    # ✅ Send results to backend API
    backend_url = "http://localhost:5000/api/predictions"  # 🔴 Replace with your backend URL
    payload = {
        "predicted_difficulties": predicted_difficulties,
        "average_expression_probabilities": avg_probs.tolist(),
        "score": score
    }
    try:
        response = requests.post(backend_url, json=payload)
        if response.status_code == 200:
            print(f"[INFO] Successfully sent results to backend. Response: {response.text}")
        else:
            print(f"[ERROR] Backend responded with status code {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Failed to send data to backend: {e}")

else:
    print("[INFO] No probabilities collected.")