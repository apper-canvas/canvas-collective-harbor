import React from 'react'
import { motion } from 'framer-motion'

const BrushToolButton = ({ 
  type, 
  icon: Icon, 
  label, 
  description, 
  selected = false, 
  onBrushChange,
  disabled = false,
  className = '' 
}) => {
  const handleClick = () => {
    if (!disabled && onBrushChange) {
      onBrushChange(type)
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center justify-center
        w-16 h-16 rounded-lg border-2 transition-all duration-200
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${selected 
          ? 'border-blue-500 bg-blue-50 text-blue-600' 
          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
        ${className}
      `}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      aria-label={`${label} tool${selected ? ' (selected)' : ''}`}
      title={description || label}
    >
      {/* Tool Icon */}
      <Icon 
        size={20} 
        className={`
          transition-colors duration-200
          ${selected ? 'text-blue-600' : 'text-gray-600'}
        `} 
      />
      
      {/* Tool Label */}
      <span className={`
        text-xs font-medium mt-1 transition-colors duration-200
        ${selected ? 'text-blue-600' : 'text-gray-500'}
      `}>
        {label}
      </span>
      
      {/* Selected Indicator */}
      {selected && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  )
}

export default BrushToolButton