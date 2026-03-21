import torch
import torch.nn as nn
import torch.nn.functional as F
import pandas as pd
import ast
import cv2
import time
import numpy as np
from PIL import Image
from transformers import AutoFeatureExtractor, AutoModelForImageClassification

# === CONFIG ===
SNAP_INTERVAL = 5        # seconds between captures
TARGET_LABELS = ['angry', 'happy', 'neutral', 'sad', 'surprise']
SEQ_LEN = 5              # length of learning path sequences

# === Load Expression Model ===
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
feature_extractor = AutoFeatureExtractor.from_pretrained("trpakov/vit-face-expression")
expression_model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression").to(device)
expression_model.eval()

# === Load & Prepare Dataset ===
df = pd.read_csv("adaptive_learning_dataset_modified.csv")
df["Learning_Path"] = df["Learning_Path"].apply(ast.literal_eval)
all_labels = sorted({lbl for path in df["Learning_Path"] for lbl in path})
label2id = {lbl:i for i,lbl in enumerate(all_labels)}
id2label = {i:lbl for lbl,i in label2id.items()}
df["Learning_Encoded"] = df["Learning_Path"].apply(lambda p: [label2id[l] for l in p])
X = df[TARGET_LABELS].values.astype(np.float32)
y = np.array(df["Learning_Encoded"].tolist())

# === Define Transformer Model ===
class LearningPathTransformer(nn.Module):
    def __init__(self, input_dim, num_classes, seq_len):
        super().__init__()
        self.embed = nn.Linear(input_dim, 128)
        enc_layer = nn.TransformerEncoderLayer(d_model=128, nhead=4, batch_first=True)
        self.transformer = nn.TransformerEncoder(enc_layer, num_layers=2)
        self.out = nn.Linear(128, num_classes)
        self.seq_len = seq_len

    def forward(self, x):
        # x: (B, input_dim) → (B, seq_len, input_dim)
        x = self.embed(x.unsqueeze(1).repeat(1, self.seq_len, 1))
        x = self.transformer(x)
        return self.out(x)  # (B, seq_len, num_classes)

model = LearningPathTransformer(5, len(label2id), SEQ_LEN).to(device)

# === Train Transformer ===
X_t = torch.tensor(X, dtype=torch.float32).to(device)
y_t = torch.tensor(y, dtype=torch.long).to(device)
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
crit = nn.CrossEntropyLoss()

model.train()
for epoch in range(10):
    opt.zero_grad()
    preds = model(X_t)
    loss = crit(preds.view(-1, len(label2id)), y_t.view(-1))
    loss.backward()
    opt.step()
    print(f"Epoch {epoch+1}/10, Loss {loss.item():.4f}")

# === Capture Snapshots ===
print("\n🟢 Capturing expression snapshots. Press 'q' to stop.")
cap = cv2.VideoCapture(0)
snapshots = []
last_capture = time.time()

while True:
    ret, frame = cap.read()
    if not ret:
        continue

    cv2.imshow("Webcam", frame)
    key = cv2.waitKey(1) & 0xFF

    # capture every SNAP_INTERVAL seconds
    if time.time() - last_capture >= SNAP_INTERVAL:
        snapshots.append(frame.copy())
        last_capture = time.time()
        print(f"✅ Snapshot {len(snapshots)} captured")

    # break on 'q'
    if key == ord('q'):
        print("🛑 Stopping capture.")
        break

cap.release()
cv2.destroyAllWindows()

if not snapshots:
    raise RuntimeError("No snapshots captured!")

# === Expression Inference & Averaging ===
probs_list = []
for img in snapshots:
    pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    inputs = feature_extractor(images=pil, return_tensors="pt").to(device)
    with torch.no_grad():
        out = expression_model(**inputs)
        probs = F.softmax(out.logits, dim=1).cpu().numpy()[0]
    probs_list.append(probs)

avg_probs = np.mean(probs_list, axis=0)
label_map = expression_model.config.id2label
expr_dict = {label_map[i].lower(): avg_probs[i] for i in range(len(avg_probs))}

# build input for path model
input_vec = np.array([[expr_dict[l] for l in TARGET_LABELS]], dtype=np.float32)

# === Predict Learning Path ===
model.eval()
with torch.no_grad():
    inp = torch.tensor(input_vec).to(device)
    out = model(inp)
    preds = torch.argmax(out, dim=-1).squeeze().cpu().tolist()
    if isinstance(preds, int):
        preds = [preds]

pred_path = [id2label[i] for i in preds]

# === Results ===
print("\n🎭 Average Expression Probabilities:")
for lbl in TARGET_LABELS:
    print(f"{lbl.capitalize():>8}: {expr_dict[lbl]:.2%}")

print("\n🎯 Predicted Next Learning Path:")
print(" → ".join(pred_path))
