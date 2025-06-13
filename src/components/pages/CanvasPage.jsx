import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

// Import organism components
import CanvasHeader from '@/components/organisms/CanvasHeader';
import CanvasDrawingArea from '@/components/organisms/CanvasDrawingArea';
import BrushToolbar from '@/components/organisms/BrushToolbar';
import ColorPickerPanel from '@/components/organisms/ColorPickerPanel';
import ChatPanel from '@/components/organisms/ChatPanel';
import ExportCanvasModal from '@/components/organisms/ExportCanvasModal';
import LoadingSpinner from '@/components/organisms/LoadingSpinner';
import ErrorMessage from '@/components/organisms/ErrorMessage';

const CanvasPage = () => {
  // Canvas state management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  
  // Drawing state
  const [brushType, setBrushType] = useState('pencil');
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  
  // UI state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Canvas history for undo/redo
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Error handling
  const handleError = useCallback((error, context = '') => {
    console.error(`Canvas error ${context}:`, error);
    setError(error.message || 'An unexpected error occurred');
    toast.error(`Error ${context}: ${error.message || 'Unknown error'}`);
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Brush handlers
  const handleBrushChange = useCallback((newBrushType) => {
    setBrushType(newBrushType);
  }, []);

  const handleBrushSizeChange = useCallback((newSize) => {
    setBrushSize(newSize);
  }, []);

  const handleBrushOpacityChange = useCallback((newOpacity) => {
    setBrushOpacity(newOpacity);
  }, []);

  // Color handlers
  const handleColorChange = useCallback((newColor) => {
    setCurrentColor(newColor);
  }, []);

  const toggleColorPicker = useCallback(() => {
    setShowColorPicker(prev => !prev);
  }, []);

  // Canvas handlers
  const handleCanvasLoad = useCallback(() => {
    setIsLoading(false);
    toast.success('Canvas loaded successfully');
  }, []);

  const handleCanvasSave = useCallback(async () => {
    try {
      setIsLoading(true);
      // Canvas save logic would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save
      toast.success('Canvas saved successfully');
    } catch (error) {
      handleError(error, 'saving canvas');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const handleCanvasClear = useCallback(() => {
    if (canvasRef.current) {
      // Clear canvas logic would go here
      toast.info('Canvas cleared');
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      // Undo logic would go here
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < canvasHistory.length - 1) {
      setHistoryIndex(prev => prev + 1);
      // Redo logic would go here
    }
  }, [historyIndex, canvasHistory.length]);

  // Export handlers
  const handleExport = useCallback(() => {
    setShowExportModal(true);
  }, []);

  const handleExportConfirm = useCallback(async (exportOptions) => {
    try {
      setIsLoading(true);
      // Export logic would go here
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate export
      toast.success('Canvas exported successfully');
      setShowExportModal(false);
    } catch (error) {
      handleError(error, 'exporting canvas');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const handleExportCancel = useCallback(() => {
    setShowExportModal(false);
  }, []);

  // Chat handlers
  const toggleChat = useCallback(() => {
    setShowChat(prev => !prev);
  }, []);

  // Initialize canvas
  useEffect(() => {
    setIsLoading(true);
    // Canvas initialization logic would go here
    const timer = setTimeout(() => {
      handleCanvasLoad();
    }, 1000);

    return () => clearTimeout(timer);
  }, [handleCanvasLoad]);

  // Error boundary
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gray-50"
      >
        <ErrorMessage
          error={error}
          onRetry={clearError}
          context="Canvas Page"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 flex flex-col"
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingSpinner message="Loading canvas..." />
        </div>
      )}

      {/* Header */}
      <CanvasHeader
        onSave={handleCanvasSave}
        onExport={handleExport}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleCanvasClear}
        onToggleChat={toggleChat}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < canvasHistory.length - 1}
        isLoading={isLoading}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Brush tools */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
          <BrushToolbar
            selectedBrush={brushType}
            onBrushChange={handleBrushChange}
            brushSize={brushSize}
            onBrushSizeChange={handleBrushSizeChange}
            brushOpacity={brushOpacity}
            onBrushOpacityChange={handleBrushOpacityChange}
          />
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col">
          {/* Color picker panel */}
          {showColorPicker && (
            <div className="bg-white border-b border-gray-200 p-4">
              <ColorPickerPanel
                currentColor={currentColor}
                onColorChange={handleColorChange}
                onClose={() => setShowColorPicker(false)}
              />
            </div>
          )}

          {/* Drawing area */}
          <div className="flex-1 relative overflow-hidden">
            <CanvasDrawingArea
              ref={canvasRef}
              brushType={brushType}
              brushSize={brushSize}
              brushOpacity={brushOpacity}
              currentColor={currentColor}
              isDrawing={isDrawing}
              onDrawingStart={() => setIsDrawing(true)}
              onDrawingEnd={() => setIsDrawing(false)}
              onColorPickerToggle={toggleColorPicker}
            />
          </div>
        </div>

        {/* Right sidebar - Chat panel */}
        {showChat && (
          <div className="w-80 bg-white border-l border-gray-200">
            <ChatPanel
              onClose={() => setShowChat(false)}
            />
          </div>
        )}
      </div>

      {/* Export modal */}
      {showExportModal && (
        <ExportCanvasModal
          onExport={handleExportConfirm}
          onCancel={handleExportCancel}
          isExporting={isLoading}
        />
      )}
    </motion.div>
  );
};

export default CanvasPage;