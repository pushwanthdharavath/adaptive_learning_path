import torch
import torch.nn.functional as F
import cv2
import time
import numpy as np
from PIL import Image
from transformers import AutoFeatureExtractor, AutoModelForImageClassification

# === CONFIG ===3
SNAP_INTERVAL = 5  # seconds
NUM_SNAPSHOTS =  20 # total snapshots
TARGET_LABELS = ['angry', 'happy', 'neutral', 'sad', 'surprise']

# === Load Model and Extractor ===
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
feature_extractor = AutoFeatureExtractor.from_pretrained("trpakov/vit-face-expression")
model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression").to(device)
model.eval()

# === Capture Snapshots ===
cap = cv2.VideoCapture(0)
snapshots = []
start_time = time.time()

print("🟢 Capturing snapshots every 5 seconds. Press 'q' to quit early...")

while len(snapshots) < NUM_SNAPSHOTS and cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    elapsed = time.time() - start_time
    if elapsed >= SNAP_INTERVAL:
        start_time = time.time()
        snapshot = frame.copy()
        snapshots.append(snapshot)
        print(f"✅ Snapshot {len(snapshots)} captured")

    cv2.imshow("ViT Expression Tracker", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

# === Run Inference ===
print("\n🔍 Running predictions...")

all_probs = []
for img_np in snapshots:
    img_pil = Image.fromarray(cv2.cvtColor(img_np, cv2.COLOR_BGR2RGB))
    inputs = feature_extractor(images=img_pil, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model(**inputs)
        probs = F.softmax(outputs.logits, dim=1).cpu().numpy()[0]
        all_probs.append(probs)

# === Average Probabilities ===
avg_probs = np.mean(all_probs, axis=0)
label_map = model.config.id2label

# Create dictionary of {label: prob}
expression_probs = {label_map[i].lower(): prob for i, prob in enumerate(avg_probs)}

# Filter only the 5 expressions
filtered_probs = {label: expression_probs[label] for label in TARGET_LABELS}

# === Display Results ===
print("\n🎭 Average Expression Probabilities (Filtered):")
for label in TARGET_LABELS:
    print(f"{label.capitalize():>8}: {filtered_probs[label]:.2%}")
