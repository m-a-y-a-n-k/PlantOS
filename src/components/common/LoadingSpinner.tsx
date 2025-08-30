import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  progress?: number;
  step?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message = 'Loading...', 
  progress,
  step 
}) => {
  return (
    <div className={`loading-spinner loading-spinner--${size}`}>
      <div className="spinner-container">
        <div className="plant-spinner">
          <div className="leaf leaf-1">🌿</div>
          <div className="leaf leaf-2">🌿</div>
          <div className="leaf leaf-3">🌿</div>
          <div className="stem">🌱</div>
        </div>
      </div>
      
      <div className="loading-text">
        <h3>{message}</h3>
        {step && <p className="loading-step">{step}</p>}
        
        {progress !== undefined && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
