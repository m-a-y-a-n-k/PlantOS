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
    <div className={`pos-loading pos-loading--${size}`} role="status" aria-live="polite">
      <div className="pos-loading-indicator" aria-hidden="true">
        <span className="pos-loading-dot" />
        <span className="pos-loading-dot" />
        <span className="pos-loading-dot" />
      </div>
      
      <div className="pos-loading-text">
        <h3 className="pos-loading-title">{message}</h3>
        {step && <p className="pos-loading-step">{step}</p>}
        
        {progress !== undefined && (
          <div className="pos-loading-progress">
            <div className="pos-loading-progressBar">
              <div 
                className="pos-loading-progressFill" 
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span className="pos-loading-progressText">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
