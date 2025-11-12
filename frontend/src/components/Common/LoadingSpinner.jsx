import React from 'react';

function LoadingSpinner({ size = 'large', text = 'Loading...' }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-blue-500 mx-auto ${sizeClasses[size]}`}></div>
        {text && <p className="mt-2 text-gray-600">{text}</p>}
      </div>
    </div>
  );
}

export default LoadingSpinner;