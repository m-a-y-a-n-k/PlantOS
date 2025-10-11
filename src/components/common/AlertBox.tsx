import React, { FC, useCallback, useEffect } from "react";
import "./AlertBox.css";

export interface AlertBoxProps {
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  onClose?: () => void;
  closable?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
  className?: string;
}

const AlertBox: FC<AlertBoxProps> = ({
  type = "info",
  title,
  message,
  onClose,
  closable = true,
  autoClose = false,
  autoCloseDelay = 5000,
  className = "",
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Wait for animation to complete
  }, [onClose]);

  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose, handleClose]);

  if (!isVisible) {
    return null;
  }

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
      default:
        return "ℹ️";
    }
  };

  return (
    <div className={`alert-box alert-${type} ${className}`}>
      <div className="alert-content">
        <div className="alert-icon">{getIcon()}</div>
        <div className="alert-text">
          {title && <div className="alert-title">{title}</div>}
          <div className="alert-message">{message}</div>
        </div>
        {closable && (
          <button
            className="alert-close"
            onClick={handleClose}
            aria-label="Close alert"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertBox;
