import logo from "./logo.svg";
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
import CustomCursor from "./components/CustomCursor"; // Import the new component
import { Navigate } from "react-router-dom";

import Blocked from "./pages/Blocked";
import NotFound from "./pages/NotFound";

import ThankYou from "./pages/ThankYou.jsx";

function App() {
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);
  const [geoChecked, setGeoChecked] = useState(false);

  React.useEffect(() => {
    const savedAppearance = localStorage.getItem("appearance") || "default";
    function applyAppearance(mode) {
      if (mode === "default") {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        document.body.setAttribute(
          "data-appearance",
          mq.matches ? "dark" : "light"
        );
        mq.addEventListener("change", (e) => {
          document.body.setAttribute(
            "data-appearance",
            e.matches ? "dark" : "light"
          );
        });
      } else {
        document.body.setAttribute("data-appearance", mode);
      }
    }
    applyAppearance(savedAppearance);
  }, []);

  React.useEffect(() => {
    fetch("https://ipwho.is")
      .then((res) => res.json())
      .then((data) => {
        if (data.country_code === "IL") {
          setIsBlocked(true);
        }
        setGeoChecked(true);
      })
      .catch((err) => {
        console.error("Geolocation error:", err);
        setGeoChecked(true); // Still proceed if API fails
      });
  }, []);

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

  // Check if current path is thank-you page
  const isThankYouPage = location.pathname === "/thank-you";
  const isNotFoundPage =
    location.pathname === "/not-found" ||
    location.pathname === "/404" ||
    // If you use a wildcard route, also check for unmatched routes:
    (!["/", "/stats", "/settings", "/thank-you", "/blocked"].includes(
      location.pathname
    ) &&
      location.pathname !== "/");

  const [isTimerActive, setIsTimerActive] = useState(() => {
    return localStorage.getItem("timerIsActive") === "true";
  });

  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "timerIsActive") {
        setIsTimerActive(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for same-tab updates (from TimerWhiteNoises)
    const handleTimerActiveChange = (e) => {
      setIsTimerActive(e.detail);
    };
    window.addEventListener("timer-active-changed", handleTimerActiveChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "timer-active-changed",
        handleTimerActiveChange
      );
    };
  }, []);

  if (location.pathname === "/blocked") {
    if (!isBlocked && geoChecked) {
      // If not blocked and geolocation check is done, redirect to home
      return <Navigate to="/" />;
    }
    // If blocked, show the Blocked page
    return <Blocked />;
  }
  if (!geoChecked) return null;
  if (isBlocked) return <Navigate to="/blocked" />;

  return (
    <div className="App">
      {customCursor === "on" && <CustomCursor />}
      <Navbar />
      <div className="main-content-container">
        {/* Show TimerWhiteNoises on all pages except thank-you and not-found */}
        {!isThankYouPage && !isNotFoundPage && (
          <TimerWhiteNoises nowTask={nowTask} />
        )}

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <Tasks setNowTask={setNowTask} isTimerActive={isTimerActive} />
              }
            />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/blocked" element={<Blocked />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
