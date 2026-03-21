// ExpressionSessionManager: manages Maggie subprocess for expression tracking
const { spawn } = require('child_process');
const path = require('path');

class ExpressionSessionManager {
  constructor() {
    this.proc = null;
    this.sessionId = null;
    this.collectedData = null;
  }

  startSession() {
    if (this.proc) return { error: 'Session already running' };
    const maggyScript = path.join(__dirname, 'maggy', 'app2.py');
    this.proc = spawn('python', [maggyScript, '--track-expressions'], { stdio: ['ignore', 'pipe', 'pipe'] });
    this.collectedData = '';
    this.proc.stdout.on('data', (data) => {
      this.collectedData += data.toString();
    });
    this.proc.stderr.on('data', (data) => {
      // Optionally log errors
    });
    this.sessionId = Date.now().toString();
    return { sessionId: this.sessionId };
  }

  stopSession() {
    return new Promise((resolve, reject) => {
      if (!this.proc) return resolve({ error: 'No session running' });
      this.proc.on('close', (code) => {
        const result = this.collectedData ? JSON.parse(this.collectedData) : {};
        this.proc = null;
        this.sessionId = null;
        this.collectedData = null;
        resolve({ result });
      });
      this.proc.kill();
    });
  }
}

module.exports = new ExpressionSessionManager();
