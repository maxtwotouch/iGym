import React from 'react';

interface LoadingSpinnerProps {
  /** Text to display below the spinner */
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
      <p className="text-gray-700">{text}</p>
    </div>
  );
};

export default LoadingSpinner;