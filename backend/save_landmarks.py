import cv2
import mediapipe as mp
import time
import json

# Initialize FaceMesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)

cap = cv2.VideoCapture(0)
start_time = time.time()
capture_interval = 5  # seconds
all_captures = []

print("🟢 Capturing facial features every 5 seconds. Press 'q' to end the game level and save data.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    if results.multi_face_landmarks:
        for landmarks in results.multi_face_landmarks:
            h, w, _ = frame.shape
            for landmark in landmarks.landmark:
                x, y = int(landmark.x * w), int(landmark.y * h)
                cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)

            current_time = time.time()
            if current_time - start_time >= capture_interval:
                start_time = current_time
                points = [[landmark.x, landmark.y] for landmark in landmarks.landmark]
                all_captures.append(points)
                print(f"📸 Captured {len(points)} landmarks.")

    cv2.imshow("Face Mesh Feature Extraction", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Save all captures to JSON file after quitting
with open("game_level_landmarks.json", "w") as file:
    json.dump(all_captures, file)
print("✅ All coordinates saved to 'game_level_landmarks.json'")

cap.release()
cv2.destroyAllWindows()
