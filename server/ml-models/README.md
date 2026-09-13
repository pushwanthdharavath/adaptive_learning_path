# ML Service Setup Instructions

This Flask service provides emotion detection using facial landmarks.

## Prerequisites
- Python 3.8 or higher
- pip package manager

## Installation

1. Navigate to the ml-models directory:
```bash
cd server/ml-models
```

2. Install required Python packages:
```bash
pip install -r requirements.txt
```

## Running the ML Service

Start the Flask server:
```bash
python app.py
```

The service will run on **http://localhost:5001**

## Available Endpoints

### GET /health
Check if the service is running and models are loaded.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "scaler_loaded": true,
  "label_encoder_loaded": true
}
```

### POST /predict
Predict emotion from facial landmarks.

**Request:**
```json
{
  "landmarks": [468 landmark coordinates]
}
```

**Response:**
```json
{
  "emotion": "happy",
  "confidence": 0.95,
  "all_probabilities": {
    "angry": 0.01,
    "disgust": 0.00,
    "fear": 0.02,
    "happy": 0.95,
    "neutral": 0.01,
    "sad": 0.00,
    "surprise": 0.01
  }
}
```

## Testing the Service

Test the health endpoint:
```bash
curl http://localhost:5001/health
```

## Troubleshooting

If you encounter errors:
1. Ensure all model files exist in the directory:
   - expression.h5
   - scaler.pkl
   - label_encoder.pkl

2. Check Python version compatibility with TensorFlow

3. Verify port 5001 is not already in use

## Integration with Node.js Backend

The Node.js backend (port 5000) will automatically call this service when:
- Starting emotion tracking
- Processing facial landmarks from the frontend
- Getting emotion predictions for adaptive difficulty