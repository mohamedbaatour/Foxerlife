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
import { AnimatePresence } from "framer-motion";

function App() {
  const location = useLocation();

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
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
