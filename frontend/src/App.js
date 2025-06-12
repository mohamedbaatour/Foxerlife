import logo from './logo.svg';
import React, { useState, useRef } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import TimerWhiteNoises from "./components/Timer-WhiteNoise.jsx";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Tasks from "./pages/Tasks";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import { AnimatePresence } from "framer-motion";
import { frame, motion, useSpring } from "motion/react";
import CustomCursor from './components/CustomCursor'; // Import the new component

function App() {
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const [isModalOpen, setIsModalOpen] = useState(false);

  //     function Drag() {
  //       const ref = useRef < HTMLDivElement > null;
  //       const { x, y } = useFollowPointer(ref);

  //       return <motion.div ref={ref} style={{ ...ball, x, y }} />;
  //     }

  // const ball = {
  //   width: 20,
  //   height: 20,
  //   backgroundColor: "#888888",
  //   borderRadius: "50%",
  // };

  // function useFollowPointer(ref) {
  //   const x = useSpring(0);
  //   const y = useSpring(0);

  //   // We'll add event handling here

  //   return { x, y };
  // }

  // const spring = { damping: 3, stiffness: 50, restDelta: 0.001 };

  // function useFollowPointer(ref) {
  //   const x = useSpring(0, spring);
  //   const y = useSpring(0, spring);

  //   // We'll add event handling here

  //   return { x, y };
  // }

  // React.useEffect(() => {
  //   if (!ref.current) return;

  //   const handlePointerMove = ({ clientX, clientY }) => {
  //     const element = ref.current;

  //     frame.read(() => {
  //       x.set(clientX - element.offsetLeft - element.offsetWidth / 2);
  //       y.set(clientY - element.offsetTop - element.offsetHeight / 2);
  //     });
  //   };

  //   window.addEventListener("pointermove", handlePointerMove);

  //   return () => window.removeEventListener("pointermove", handlePointerMove);
  // }, []);

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
      if (
        isModalOpen ||
        event.target.isContentEditable ||
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (event.key) {
        case "1":
          navigate("/");
          break;
        case "2":
          navigate("/stats");
          break;
        case "3":
          navigate("/settings");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
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
      window.removeEventListener("modal-state-change", handleModalStateChange);
  }, []);

  // Ensure the state is initialized from localStorage
  const [customCursor, setCustomCursor] = useState(() => {
    const savedCustomCursor = localStorage.getItem("customCursor");
    return savedCustomCursor ? savedCustomCursor : "on";
  });

  // Ensure the CustomCursor component is conditionally rendered
  React.useEffect(() => {
    const handleCustomCursorChange = (e) => {
      setCustomCursor(e.detail);
    };

    window.addEventListener("customCursorChanged", handleCustomCursorChange);
    return () =>
      window.removeEventListener(
        "customCursorChanged",
        handleCustomCursorChange
      );
  }, []);

  return (
    <div className="App">
      {customCursor === "on" && <CustomCursor />}
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
