import json
import numpy as np
from tensorflow.keras.models import load_model

# Load the Keras model
model = load_model("expression.h5")

# Load landmarks from JSON
with open("game_level_landmarks.json", "r") as file:
    data = json.load(file)

# Make sure we only use the first 468 landmarks (exclude iris or extra points)
# Each entry should be: [[x1, y1], [x2, y2], ..., [x468, y468]]
X = np.array([np.array(coords[:468]).flatten() for coords in data])

# Sanity check
print(f"🧪 Loaded {len(X)} samples with shape {X.shape[1]} each (expected: 936)")

# Predict probabilities
predictions = model.predict(X)

# Average probabilities
avg_probabilities = np.mean(predictions, axis=0)

# Define expression labels (make sure they match your model's output order)
expressions = ['angry', 'happy', 'neutral', 'sad', 'surprise']

# Output results
print("\n🎭 Average Expression Probabilities During Game Level:")
for label, prob in zip(expressions, avg_probabilities):
    print(f"{label.capitalize():>8}: {prob:.2%}")
