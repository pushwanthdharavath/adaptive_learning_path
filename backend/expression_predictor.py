import cv2
import mediapipe as mp
import time
import numpy as np
from tensorflow.keras.models import load_model

# Load the trained model
model = load_model("expression.h5")

# Emotion labels in your model
expressions = ['angry', 'happy', 'neutral', 'sad', 'surprise']

# Initialize FaceMesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)

# Webcam
cap = cv2.VideoCapture(0)
start_time = time.time()

# Store landmarks here
all_landmark_sets = []

print("🟢 Capturing landmarks every 5 seconds. Press 'q' to finish and predict...")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    if results.multi_face_landmarks:
        for landmarks in results.multi_face_landmarks:
            # Draw face landmarks
            for landmark in landmarks.landmark:
                h, w, _ = frame.shape
                x, y = int(landmark.x * w), int(landmark.y * h)
                cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)

            # Capture every 5 seconds
            current_time = time.time()
            if current_time - start_time >= 5:
                start_time = current_time

                # Save first 468 points only
                coords = [[l.x, l.y] for l in landmarks.landmark[:468]]
                all_landmark_sets.append(coords)
                print(f"✅ Captured {len(all_landmark_sets)} set(s)")

    # Show frame
    cv2.imshow("Facial Expression Tracker", frame)

    # Quit key
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

print("\n🔍 Running predictions on captured data...")

# Convert to model input shape
X = np.array([np.array(coords).flatten() for coords in all_landmark_sets])

# Predict
predictions = model.predict(X)
avg_probs = np.mean(predictions, axis=0)

print("\n🎭 Average Expression Probabilities:")
for label, prob in zip(expressions, avg_probs):
    print(f"{label.capitalize():>8}: {prob:.2%}")
