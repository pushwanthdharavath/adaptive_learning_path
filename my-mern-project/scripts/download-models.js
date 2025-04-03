const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../client/public/models');
const models = [
  {
    name: 'tiny_face_detector_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json'
  },
  {
    name: 'tiny_face_detector_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1'
  },
  {
    name: 'face_expression_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json'
  },
  {
    name: 'face_expression_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1'
  }
];

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Download function
function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(modelsDir, filename);
    const file = fs.createWriteStream(filepath);

    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${filename}`);
        resolve();
      });
    }).on('error', err => {
      fs.unlink(filepath, () => reject(err));
    });
  });
}

// Download all models
async function downloadAllModels() {
  console.log('🚀 Starting model downloads...');
  try {
    await Promise.all(models.map(model => downloadFile(model.url, model.name)));
    console.log('✨ All models downloaded successfully!');
  } catch (error) {
    console.error('❌ Error downloading models:', error);
    process.exit(1);
  }
}

downloadAllModels(); 