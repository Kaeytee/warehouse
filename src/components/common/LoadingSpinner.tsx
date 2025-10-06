/**
 * LoadingSpinner Component
 * 
 * A reusable, centered loading spinner for indicating background processes
 * without blocking the entire UI.
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-transparent">
      <div className="text-center">
        <div 
          className={`animate-spin rounded-full border-b-2 border-red-600 mx-auto ${sizeClasses[size]}`}
        ></div>
        {text && <p className="mt-3 text-gray-600 text-sm">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
