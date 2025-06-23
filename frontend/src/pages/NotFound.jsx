import React from "react";
import "./NotFound.css";
import NotFoundImage from "../icones/404.png";
import { useNavigate } from "react-router-dom"; // Add this import
import { motion } from "framer-motion"; // Import motion for animations

const NotFound = () => {
  const navigate = useNavigate(); // Initialize the hook

  return (
    <motion.div className="not-found-container"
    initial={{ y: 50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 50, opacity: 0 }}
    transition={{ duration: 0.3 }}>
      <div className="not-found-text">
        <p className="not-found-title">404</p>
        <p className="not-found-subtitle">
          The page you are looking for doesn't exist or has been moved
        </p>
        <button
          className="not-found-CTA"
          onClick={() => navigate("/")}
        >
          Go back to tasks
        </button>
      </div>
      <img src={NotFoundImage} alt="Page Not Found" className="not-found-image" />
    </motion.div>
  );
};

export default NotFound;