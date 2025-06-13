import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/atoms/Button';

const CanvasHeader = ({ 
  title = "Canvas Collective", 
  onSave,
  onClear,
  onExport,
  isSaving = false 
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <button
          onClick={handleGoHome}
          className="text-gray-600 hover:text-gray-800 transition-colors"
          aria-label="Go to home"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-800">
          {title}
        </h1>
      </div>

      <div className="flex items-center space-x-3">
        {onClear && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="text-gray-600 hover:text-gray-800"
          >
            Clear
          </Button>
        )}
        
        {onSave && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="text-blue-600 hover:text-blue-800"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        )}
        
        {onExport && (
          <Button
            variant="primary"
            size="sm"
            onClick={onExport}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Export
          </Button>
        )}
      </div>
    </header>
  );
};

export default CanvasHeader;