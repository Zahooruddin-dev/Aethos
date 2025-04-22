import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import './Voice.css'
const VoiceInput = ({ onSpeechResult, isLoading }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onSpeechResult(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [onSpeechResult]);

  const toggleListening = useCallback(() => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }, [recognition, isListening]);

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={isLoading}
      className={`voice-btn ${isListening ? 'listening' : ''}`}
      data-tooltip={isListening ? 'Stop Listening' : 'Voice Input'}
      aria-label={isListening ? 'Stop Listening' : 'Voice Input'}

    >
      {isListening ? 
        <Mic className="animate-pulse text-red-500" /> : 
        <MicOff />
      }
    </button>
  );
};

export default VoiceInput;