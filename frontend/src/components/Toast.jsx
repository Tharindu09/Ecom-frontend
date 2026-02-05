import React, { useEffect } from "react";

const Toast = ({ message, type = "info", onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast--${type}`}>
      <span>{message}</span>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
};

export default Toast;
