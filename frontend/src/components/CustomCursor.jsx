import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './CustomCursor.css'; // We'll create this CSS file next

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });

  useEffect(() => {
    const mouseMove = e => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', mouseMove);

    return () => {
      window.removeEventListener('mousemove', mouseMove);
    };
  }, []);

  const variants = {
    default: {
      x: mousePosition.x + 16, // Adjust for half the ball's width (32px / 2)
      y: mousePosition.y + 16, // Adjust for half the ball's height (32px / 2)
      transition: { type: "spring", stiffness: 1000, damping: 80 }
    }
  };

  return (
    <motion.div
      className="custom-cursor"
      variants={variants}
      animate="default"
    />
  );
};

export default CustomCursor;