import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import ApperIcon from './ApperIcon';
import { canvasService } from '../services';

const BRUSH_TYPES = [
  { id: 'pencil', name: 'Pencil', icon: 'Pencil' },
  { id: 'marker', name: 'Marker', icon: 'Circle' },
  { id: 'airbrush', name: 'Airbrush', icon: 'Droplets' },
  { id: 'eraser', name: 'Eraser', icon: 'Eraser' },
  { id: 'fill', name: 'Fill', icon: 'PaintBucket' }
];

const COLOR_PRESETS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#000000', '#374151', '#FFFFFF'
];

const EXPORT_SIZES = [
  { label: 'HD Wallpaper', width: 1920, height: 1080 },
  { label: '2K Wallpaper', width: 2560, height: 1440 },
  { label: 'Custom Size', width: 1200, height: 800 }
];

const MainFeature = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentUser] = useState({
    id: 'user-1',
    name: 'You',
    cursorColor: '#6366F1',
    cursorPosition: { x: 0, y: 0 },
    activeTool: 'pencil'
  });

  // Drawing state
  const [selectedTool, setSelectedTool] = useState('pencil');
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [brushSize, setBrushSize] = useState(5);
  const [opacity, setOpacity] = useState(100);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);

  // UI state
  const [zoom, setZoom] = useState(100);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#6366F1');
  const [chatMessage, setChatMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeCanvas = async () => {
      setLoading(true);
      setError(null);
      try {
        const canvasData = await canvasService.getCanvas();
        setCanvas(canvasData);
        const usersData = await canvasService.getUsers();
        setUsers(usersData);
        const messagesData = await canvasService.getMessages();
        setMessages(messagesData);
      } catch (err) {
        setError(err.message || 'Failed to initialize canvas');
        toast.error('Failed to load canvas');
      } finally {
        setLoading(false);
      }
    };

    initializeCanvas();
  }, []);

  useEffect(() => {
    if (canvasRef.current && canvas) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = canvas.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw existing strokes
      canvas.strokes.forEach(stroke => {
        drawStroke(ctx, stroke);
      });
    }
  }, [canvas]);

  const drawStroke = (ctx, stroke) => {
    if (stroke.points.length === 0) return;

    ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.globalAlpha = stroke.opacity / 100;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'airbrush') {
      stroke.points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      });
    } else {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    
    const pos = getMousePos(e);
    setIsDrawing(true);
    setCurrentStroke([pos]);
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    const pos = getMousePos(e);
    
    if (isDrawing) {
      const newStroke = [...currentStroke, pos];
      setCurrentStroke(newStroke);
      
      // Draw current stroke immediately
      const ctx = canvasRef.current.getContext('2d');
      const stroke = {
        tool: selectedTool,
        color: selectedColor,
        size: brushSize,
        opacity: opacity,
        points: newStroke
      };
      
      // Clear and redraw everything
      ctx.fillStyle = canvas?.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      canvas?.strokes.forEach(s => drawStroke(ctx, s));
      drawStroke(ctx, stroke);
    }
  };

  const handleMouseUp = async () => {
    if (!isDrawing || currentStroke.length === 0) return;
    
    setIsDrawing(false);
    
    try {
      const newStroke = {
        id: `stroke-${Date.now()}`,
        userId: currentUser.id,
        tool: selectedTool,
        color: selectedColor,
        size: brushSize,
        opacity: opacity,
        points: currentStroke,
        timestamp: Date.now()
      };

      await canvasService.addStroke(newStroke);
      
      // Update local canvas state
      setCanvas(prev => ({
        ...prev,
        strokes: [...prev.strokes, newStroke]
      }));
      
      toast.success('Stroke added successfully');
    } catch (err) {
      toast.error('Failed to save stroke');
    } finally {
      setCurrentStroke([]);
    }
  };

  const handleClearCanvas = async () => {
    try {
      await canvasService.clearCanvas();
      setCanvas(prev => ({ ...prev, strokes: [] }));
      
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = canvas?.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      toast.success('Canvas cleared');
    } catch (err) {
      toast.error('Failed to clear canvas');
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    try {
      const newMessage = {
        id: `msg-${Date.now()}`,
        userId: currentUser.id,
        text: chatMessage.trim(),
        timestamp: Date.now()
      };

      await canvasService.addMessage(newMessage);
      setMessages(prev => [...prev, newMessage]);
      setChatMessage('');
      toast.success('Message sent');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleExport = (size) => {
    if (!canvasRef.current) return;
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = size.width;
    exportCanvas.height = size.height;
    const ctx = exportCanvas.getContext('2d');
    
    // Scale and draw current canvas
    ctx.drawImage(canvasRef.current, 0, 0, size.width, size.height);
    
    const link = document.createElement('a');
    link.download = `canvas-collective-${size.width}x${size.height}.png`;
    link.href = exportCanvas.toDataURL();
    link.click();
    
    setShowExportModal(false);
    toast.success('Canvas exported successfully');
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ApperIcon name="AlertCircle" className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Canvas Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Toolbar */}
      <div className="w-20 bg-surface border-r border-slate-600 flex flex-col items-center py-4 space-y-4">
        {/* Brush Tools */}
        <div className="space-y-2">
          {BRUSH_TYPES.map((brush) => (
            <motion.button
              key={brush.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTool(brush.id)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                selectedTool === brush.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
              }`}
            >
              <ApperIcon name={brush.icon} size={20} />
            </motion.button>
          ))}
        </div>

        {/* Brush Size */}
        <div className="space-y-2">
          <div className="text-xs text-slate-400 text-center">Size</div>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-12 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${(brushSize / 50) * 100}%, #475569 ${(brushSize / 50) * 100}%, #475569 100%)`
            }}
          />
          <div className="text-xs text-slate-300 text-center">{brushSize}</div>
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="text-xs text-slate-400 text-center">Opacity</div>
          <input
            type="range"
            min="10"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-12 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${opacity}%, #475569 ${opacity}%, #475569 100%)`
            }}
          />
          <div className="text-xs text-slate-300 text-center">{opacity}%</div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="h-16 bg-surface border-b border-slate-600 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-heading font-bold text-slate-100">Canvas Collective</h1>
            
            {/* Active Users */}
            <div className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: currentUser.cursorColor }}
              >
                <span className="text-xs font-medium text-white">Y</span>
              </motion.div>
              {users.filter(u => u.id !== currentUser.id).map((user) => (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: user.cursorColor }}
                >
                  <span className="text-xs font-medium text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                className="w-8 h-8 bg-slate-700 text-slate-300 rounded flex items-center justify-center hover:bg-slate-600"
              >
                <ApperIcon name="Minus" size={16} />
              </motion.button>
              <span className="text-sm text-slate-400 min-w-[4rem] text-center">{zoom}%</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="w-8 h-8 bg-slate-700 text-slate-300 rounded flex items-center justify-center hover:bg-slate-600"
              >
                <ApperIcon name="Plus" size={16} />
              </motion.button>
            </div>

            {/* Clear Canvas */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearCanvas}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-500 transition-colors"
            >
              Clear
            </motion.button>

            {/* Export */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExportModal(true)}
              className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-primary/90 transition-colors"
            >
              Export
            </motion.button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex items-center justify-center bg-slate-900 p-8 overflow-hidden">
            <div 
              className={`canvas-container brush-${selectedTool} relative shadow-2xl`}
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <canvas
                ref={canvasRef}
                width={canvas?.width || 1200}
                height={canvas?.height || 800}
                className="bg-white rounded-lg"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>

          {/* Right Chat Panel */}
          <div className="w-80 bg-surface border-l border-slate-600 flex flex-col">
            {/* Chat Header */}
            <div className="h-16 border-b border-slate-600 flex items-center px-4">
              <h3 className="font-medium text-slate-100">Team Chat</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <ApperIcon name="MessageCircle" className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Start chatting with your team</p>
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        message.userId === currentUser.id
                          ? 'bg-primary text-white'
                          : 'bg-slate-700 text-slate-100'
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-600">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-slate-700 text-slate-100 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <ApperIcon name="Send" size={16} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Color Picker Bottom Panel */}
        <div className="h-20 bg-surface border-t border-slate-600 flex items-center px-6 space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">Color:</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-10 h-10 rounded-lg border-2 border-slate-600 relative overflow-hidden"
              style={{ backgroundColor: selectedColor }}
            >
              {showColorPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full left-0 mb-2 p-4 bg-slate-800 rounded-lg shadow-xl border border-slate-600 z-50"
                >
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setSelectedColor(e.target.value);
                    }}
                    className="w-20 h-8 rounded border-none cursor-pointer"
                  />
                </motion.div>
              )}
            </motion.button>
          </div>

          <div className="flex items-center space-x-2 flex-1">
            {COLOR_PRESETS.map((color) => (
              <motion.button
                key={color}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                  selectedColor === color ? 'border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowExportModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-surface rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-600">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Export Canvas</h3>
                <div className="space-y-3">
                  {EXPORT_SIZES.map((size) => (
                    <motion.button
                      key={`${size.width}x${size.height}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport(size)}
                      className="w-full p-3 bg-slate-700 text-slate-100 rounded-lg hover:bg-slate-600 transition-colors text-left"
                    >
                      <div className="font-medium">{size.label}</div>
                      <div className="text-sm text-slate-400">{size.width} × {size.height}</div>
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowExportModal(false)}
                  className="w-full mt-4 p-3 bg-slate-600 text-slate-300 rounded-lg hover:bg-slate-500 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainFeature;