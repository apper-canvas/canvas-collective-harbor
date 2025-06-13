import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react'
import { motion } from 'framer-motion'

const CanvasDrawingArea = forwardRef(({
  brushType = 'pencil',
  brushSize = 5,
  brushOpacity = 1,
  color = '#000000',
  onLoad,
  onSave,
  onClear,
  onUndo,
  onRedo,
  onError
}, ref) => {
  const canvasRef = useRef(null)
  const contextRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [lastPoint, setLastPoint] = useState(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    
    context.scale(window.devicePixelRatio, window.devicePixelRatio)
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    // Set default properties
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.imageSmoothingEnabled = true

    contextRef.current = context

    // Save initial state
    saveToHistory()

    if (onLoad) {
      onLoad()
    }
  }, [onLoad])

  // Update brush properties
  useEffect(() => {
    const context = contextRef.current
    if (!context) return

    context.globalAlpha = brushOpacity
    context.lineWidth = brushSize
    
    switch (brushType) {
      case 'pencil':
        context.globalCompositeOperation = 'source-over'
        context.strokeStyle = color
        context.lineCap = 'round'
        break
      case 'marker':
        context.globalCompositeOperation = 'multiply'
        context.strokeStyle = color
        context.lineCap = 'round'
        break
      case 'airbrush':
        context.globalCompositeOperation = 'source-over'
        context.strokeStyle = color
        context.lineCap = 'round'
        context.shadowColor = color
        context.shadowBlur = brushSize / 2
        break
      case 'eraser':
        context.globalCompositeOperation = 'destination-out'
        context.lineCap = 'round'
        break
      case 'fill':
        context.globalCompositeOperation = 'source-over'
        context.fillStyle = color
        break
      default:
        context.globalCompositeOperation = 'source-over'
        context.strokeStyle = color
        context.lineCap = 'round'
    }
  }, [brushType, brushSize, brushOpacity, color])

  // Save canvas state to history
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const imageData = canvas.toDataURL()
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1)
        newHistory.push(imageData)
        return newHistory.slice(-50) // Keep last 50 states
      })
      setHistoryIndex(prev => Math.min(prev + 1, 49))
    } catch (error) {
      console.error('Failed to save canvas state:', error)
      if (onError) {
        onError('Failed to save canvas state')
      }
    }
  }, [historyIndex, onError])

  // Get point from event
  const getPointFromEvent = useCallback((event) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const clientX = event.clientX || (event.touches && event.touches[0]?.clientX)
    const clientY = event.clientY || (event.touches && event.touches[0]?.clientY)

    if (clientX === undefined || clientY === undefined) return null

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }, [])

  // Flood fill algorithm
  const floodFill = useCallback((startX, startY, targetColor, fillColor) => {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) return

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const width = canvas.width
    const height = canvas.height

    const targetR = targetColor[0]
    const targetG = targetColor[1]
    const targetB = targetColor[2]
    const targetA = targetColor[3]

    const fillR = fillColor[0]
    const fillG = fillColor[1]
    const fillB = fillColor[2]
    const fillA = fillColor[3]

    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) {
      return
    }

    const stack = [[Math.floor(startX), Math.floor(startY)]]

    while (stack.length > 0) {
      const [x, y] = stack.pop()
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue

      const index = (y * width + x) * 4

      if (
        data[index] === targetR &&
        data[index + 1] === targetG &&
        data[index + 2] === targetB &&
        data[index + 3] === targetA
      ) {
        data[index] = fillR
        data[index + 1] = fillG
        data[index + 2] = fillB
        data[index + 3] = fillA

        stack.push([x + 1, y])
        stack.push([x - 1, y])
        stack.push([x, y + 1])
        stack.push([x, y - 1])
      }
    }

    context.putImageData(imageData, 0, 0)
  }, [])

  // Start drawing
  const startDrawing = useCallback((event) => {
    event.preventDefault()
    const point = getPointFromEvent(event)
    if (!point) return

    const context = contextRef.current
    if (!context) return

    setIsDrawing(true)
    setLastPoint(point)

    if (brushType === 'fill') {
      try {
        const canvas = canvasRef.current
        const imageData = context.getImageData(point.x, point.y, 1, 1)
        const targetColor = Array.from(imageData.data)
        
        // Convert hex color to RGB
        const hex = color.replace('#', '')
        const fillColor = [
          parseInt(hex.substr(0, 2), 16),
          parseInt(hex.substr(2, 2), 16),
          parseInt(hex.substr(4, 2), 16),
          255
        ]

        floodFill(point.x, point.y, targetColor, fillColor)
        saveToHistory()
      } catch (error) {
        console.error('Fill operation failed:', error)
        if (onError) {
          onError('Fill operation failed')
        }
      }
    } else {
      context.beginPath()
      context.moveTo(point.x, point.y)
    }
  }, [brushType, color, getPointFromEvent, floodFill, saveToHistory, onError])

  // Draw
  const draw = useCallback((event) => {
    if (!isDrawing || brushType === 'fill') return

    event.preventDefault()
    const point = getPointFromEvent(event)
    if (!point || !lastPoint) return

    const context = contextRef.current
    if (!context) return

    if (brushType === 'airbrush') {
      // Airbrush effect with multiple small circles
      const distance = Math.sqrt(
        Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2)
      )
      
      for (let i = 0; i < distance; i += 2) {
        const ratio = i / distance
        const x = lastPoint.x + (point.x - lastPoint.x) * ratio
        const y = lastPoint.y + (point.y - lastPoint.y) * ratio
        
        context.beginPath()
        context.arc(x, y, brushSize / 4, 0, 2 * Math.PI)
        context.fill()
      }
    } else {
      context.lineTo(point.x, point.y)
      context.stroke()
    }

    setLastPoint(point)
  }, [isDrawing, brushType, brushSize, getPointFromEvent, lastPoint])

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return

    setIsDrawing(false)
    setLastPoint(null)

    const context = contextRef.current
    if (context && brushType !== 'fill') {
      context.closePath()
    }

    // Save to history after drawing
    setTimeout(() => {
      saveToHistory()
    }, 10)
  }, [isDrawing, brushType, saveToHistory])

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    save: () => {
      try {
        const canvas = canvasRef.current
        if (!canvas) return null

        const dataURL = canvas.toDataURL()
        if (onSave) {
          onSave(dataURL)
        }
        return dataURL
      } catch (error) {
        console.error('Failed to save canvas:', error)
        if (onError) {
          onError('Failed to save canvas')
        }
        return null
      }
    },
    
    load: (imageData) => {
      try {
        setIsLoading(true)
        const canvas = canvasRef.current
        const context = contextRef.current
        if (!canvas || !context) return

        const img = new Image()
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height)
          context.drawImage(img, 0, 0)
          saveToHistory()
          setIsLoading(false)
        }
        img.onerror = () => {
          setIsLoading(false)
          if (onError) {
            onError('Failed to load image')
          }
        }
        img.src = imageData
      } catch (error) {
        setIsLoading(false)
        console.error('Failed to load canvas:', error)
        if (onError) {
          onError('Failed to load canvas')
        }
      }
    },

    clear: () => {
      try {
        const canvas = canvasRef.current
        const context = contextRef.current
        if (!canvas || !context) return

        context.clearRect(0, 0, canvas.width, canvas.height)
        saveToHistory()
        if (onClear) {
          onClear()
        }
      } catch (error) {
        console.error('Failed to clear canvas:', error)
        if (onError) {
          onError('Failed to clear canvas')
        }
      }
    },

    undo: () => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        
        const canvas = canvasRef.current
        const context = contextRef.current
        if (!canvas || !context) return

        const img = new Image()
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height)
          context.drawImage(img, 0, 0)
        }
        img.src = history[newIndex]
        
        if (onUndo) {
          onUndo()
        }
      }
    },

    redo: () => {
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        
        const canvas = canvasRef.current
        const context = contextRef.current
        if (!canvas || !context) return

        const img = new Image()
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height)
          context.drawImage(img, 0, 0)
        }
        img.src = history[newIndex]
        
        if (onRedo) {
          onRedo()
        }
      }
    },

    canUndo: () => historyIndex > 0,
    canRedo: () => historyIndex < history.length - 1
  }), [history, historyIndex, onSave, onClear, onUndo, onRedo, onError, saveToHistory])

  return (
    <motion.div
      className="relative w-full h-full bg-white rounded-lg shadow-sm overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className={`w-full h-full cursor-crosshair ${
          brushType === 'eraser' ? 'cursor-grab' : ''
        } ${brushType === 'fill' ? 'cursor-cell' : ''}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{
          touchAction: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none'
        }}
      />
      
      <div className="absolute top-2 left-2 text-xs text-gray-500 pointer-events-none">
        {brushType.charAt(0).toUpperCase() + brushType.slice(1)} • Size: {brushSize} • Opacity: {Math.round(brushOpacity * 100)}%
      </div>
    </motion.div>
  )
})

CanvasDrawingArea.displayName = 'CanvasDrawingArea'

export default CanvasDrawingArea