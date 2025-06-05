import logo from './logo.svg';
import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import TimerWhiteNoises from "./components/Timer-WhiteNoise.jsx";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Tasks from "./pages/Tasks";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Import useNavigate

function App() {
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
    const [isModalOpen, setIsModalOpen] = useState(false); 

  // Add state for nowTask at App level
  const [nowTask, setNowTask] = useState(() => {
    const savedNowTask = localStorage.getItem("nowTask");
    return savedNowTask ? JSON.parse(savedNowTask) : null;
  });

  // Listen for nowTask changes across the app
  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "nowTask") {
        setNowTask(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events for same-tab updates
    const handleNowTaskUpdate = (e) => {
      setNowTask(e.detail);
    };

    window.addEventListener("nowTaskUpdated", handleNowTaskUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("nowTaskUpdated", handleNowTaskUpdate);
    };
  }, []);

  // Effect for keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (event) => {
      // Check if modal is open or if target is an input/contenteditable element
      if (isModalOpen || 
          event.target.isContentEditable || 
          event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case '1':
          navigate('/');
          break;
        case '2':
          navigate('/stats');
          break;
        case '3':
          navigate('/settings');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate, isModalOpen]); // Depend on navigate to ensure the effect re-runs if navigate changes

    React.useEffect(() => {
      const handleModalStateChange = (e) => {
        if (e.detail.type === "modal") {
          setIsModalOpen(e.detail.isOpen);
        }
      };

      window.addEventListener("modal-state-change", handleModalStateChange);
      return () =>
        window.removeEventListener(
          "modal-state-change",
          handleModalStateChange
        );
    }, []);

  return (
    <div className="App">
      <Navbar />
      {/* Timer component now persists across all pages */}
      <div className="main-content-container">
       <TimerWhiteNoises nowTask={nowTask} />
        {/* Wrap Routes in a new container div */}

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Tasks setNowTask={setNowTask} />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
