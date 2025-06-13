import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ApperIcon from '../components/ApperIcon';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <ApperIcon name="Palette" className="w-16 h-16 text-slate-400 mx-auto" />
        </motion.div>
        <h1 className="mt-4 text-2xl font-heading font-bold text-slate-100">Page Not Found</h1>
        <p className="mt-2 text-slate-400">The canvas you're looking for doesn't exist</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/canvas')}
          className="mt-6 px-6 py-3 bg-primary text-white rounded-lg font-medium transition-colors hover:bg-primary/90"
        >
          Back to Canvas
        </motion.button>
      </motion.div>
    </div>
  );
};

export default NotFound;