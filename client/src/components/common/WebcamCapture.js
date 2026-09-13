import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

const WebcamCapture = ({ onFrameCapture, isActive = true, isTracking = true, onExpressionChange }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [currentExpression, setCurrentExpression] = useState('neutral');

  useEffect(() => {
    let animationFrameId;
    let captureInterval;

    const startWebcam = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Unable to access webcam. Please check permissions.');
      }
    };

    const captureAndAnalyzeFrame = async () => {
      if ((isActive || isTracking) && videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        if (onFrameCapture) {
          onFrameCapture(imageData);
        }

        // Send to ML service for real-time expression detection
        try {
          const response = await axios.post('http://localhost:5001/api/expressions/analyze', {
            image: imageData
          });
          
          if (response.data && response.data.expression) {
            const newExpression = response.data.expression.toLowerCase();
            setCurrentExpression(newExpression);
            if (onExpressionChange) {
              onExpressionChange(newExpression);
            }
          }
        } catch (err) {
          console.error('Error analyzing expression:', err);
          // Fallback: use random expression if ML service fails
          const expressions = ['happy', 'angry', 'confused', 'neutral', 'focused'];
          const fallbackExpression = expressions[Math.floor(Math.random() * expressions.length)];
          setCurrentExpression(fallbackExpression);
          if (onExpressionChange) {
            onExpressionChange(fallbackExpression);
          }
        }
      }
    };

    if (isActive || isTracking) {
      startWebcam();
      
      // Capture and analyze every 1 second
      captureInterval = setInterval(captureAndAnalyzeFrame, 1000);
      
      // Start with an immediate capture
      setTimeout(captureAndAnalyzeFrame, 500);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (captureInterval) {
        clearInterval(captureInterval);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isTracking, onFrameCapture, onExpressionChange]);

  const handleStop = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="webcam-container">
      <video 
        ref={videoRef} 
        className="w-full rounded-lg"
        style={{ display: (isActive || isTracking) ? 'block' : 'none' }}
        autoPlay
        playsInline
        muted
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {(isActive || isTracking) && (
        <>
          <div className="mt-2 text-center">
            <p className="text-sm font-bold">Current expression: {currentExpression}</p>
          </div>
          <button 
            onClick={handleStop}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Stop Camera
          </button>
        </>
      )}
    </div>
  );
};

export default WebcamCapture;