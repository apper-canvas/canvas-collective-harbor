import React from 'react'
import { motion } from 'framer-motion'
import { Brush, Edit3, Airplay, Eraser, PaintBucket, Minus, Plus } from 'lucide-react'
import BrushToolButton from '@/components/molecules/BrushToolButton'
import RangeSlider from '@/components/molecules/RangeSlider'

const BrushToolbar = ({
  selectedBrush = 'pencil',
  brushSize = 5,
  brushOpacity = 100,
  onBrushChange,
  onBrushSizeChange,
  onBrushOpacityChange
}) => {
  const brushTools = [
    {
      type: 'pencil',
      icon: Edit3,
      label: 'Pencil',
      description: 'Draw with a pencil'
    },
    {
      type: 'marker',
      icon: Brush,
      label: 'Marker',
      description: 'Draw with a marker'
    },
    {
      type: 'airbrush',
      icon: Airplay,
      label: 'Airbrush',
      description: 'Spray paint effect'
    },
    {
      type: 'eraser',
      icon: Eraser,
      label: 'Eraser',
      description: 'Erase drawing'
    },
    {
      type: 'fill',
icon: PaintBucket,
      label: 'Fill',
      description: 'Fill area with color'
    }
  ]

  const handleSizeDecrease = () => {
    const newSize = Math.max(1, brushSize - 1)
    onBrushSizeChange?.(newSize)
  }

  const handleSizeIncrease = () => {
    const newSize = Math.min(100, brushSize + 1)
    onBrushSizeChange?.(newSize)
  }

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-16 md:w-20 flex flex-col gap-3"
    >
      {/* Brush Tools */}
      <div className="flex flex-col gap-2">
        {brushTools.map((tool) => (
          <BrushToolButton
            key={tool.type}
            icon={tool.icon}
            label={tool.label}
            description={tool.description}
            isActive={selectedBrush === tool.type}
            onClick={() => onBrushChange?.(tool.type)}
          />
        ))}
      </div>

      {/* Brush Size Controls */}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleSizeIncrease}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
            title="Increase brush size"
          >
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          
          <div className="flex flex-col items-center gap-1">
            <div 
              className="w-6 h-6 rounded-full bg-gray-800 dark:bg-white flex items-center justify-center"
              style={{
                width: `${Math.max(8, Math.min(24, brushSize))}px`,
                height: `${Math.max(8, Math.min(24, brushSize))}px`
              }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              {brushSize}
            </span>
          </div>

          <button
            onClick={handleSizeDecrease}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
            title="Decrease brush size"
          >
            <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Brush Opacity */}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
            Opacity
          </span>
          <RangeSlider
            min={10}
            max={100}
            value={brushOpacity}
            onChange={onBrushOpacityChange}
            className="w-12 rotate-90 origin-center"
            vertical
          />
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {brushOpacity}%
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default BrushToolbar