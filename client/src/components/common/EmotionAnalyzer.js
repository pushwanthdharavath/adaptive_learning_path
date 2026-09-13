import React, { useState, useEffect, useRef } from 'react';

const EmotionAnalyzer = ({ 
  onEmotionDetected, 
  isActive = true,
  analysisInterval = 1000 
}) => {
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [confidence, setConfidence] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisTimerRef = useRef(null);

  useEffect(() => {
    if (isActive && !isAnalyzing) {
      setIsAnalyzing(true);
      startAnalysis();
    } else if (!isActive && isAnalyzing) {
      setIsAnalyzing(false);
      stopAnalysis();
    }

    return () => {
      stopAnalysis();
    };
  }, [isActive]);

  const startAnalysis = () => {
    analysisTimerRef.current = setInterval(() => {
      // Simulate emotion detection (in real implementation, this would use ML models)
      const emotions = ['happy', 'sad', 'frustrated', 'engaged', 'neutral', 'confused'];
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const randomConfidence = Math.random() * 0.3 + 0.7; // 0.7 to 1.0

      setCurrentEmotion(randomEmotion);
      setConfidence(randomConfidence);

      if (onEmotionDetected) {
        onEmotionDetected({
          emotion: randomEmotion,
          confidence: randomConfidence,
          timestamp: new Date().toISOString()
        });
      }
    }, analysisInterval);
  };

  const stopAnalysis = () => {
    if (analysisTimerRef.current) {
      clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: 'bg-green-500',
      sad: 'bg-blue-500',
      frustrated: 'bg-red-500',
      engaged: 'bg-yellow-500',
      neutral: 'bg-gray-500',
      confused: 'bg-purple-500'
    };
    return colors[emotion] || 'bg-gray-500';
  };

  return (
    <div className="emotion-analyzer p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Emotion Detection</h3>
        <div className={`w-3 h-3 rounded-full ${isAnalyzing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current Emotion:</span>
          <span className={`px-3 py-1 rounded-full text-white text-sm ${getEmotionColor(currentEmotion)}`}>
            {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Confidence:</span>
          <span className="text-sm font-medium">{(confidence * 100).toFixed(1)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default EmotionAnalyzer;