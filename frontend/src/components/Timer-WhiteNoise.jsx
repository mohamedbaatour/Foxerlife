import React, { useState, useEffect, useRef } from "react";
import "./Timer-WhiteNoise.css";
import { ReactComponent as StartIcon } from "../icones/start.svg";
import { ReactComponent as EndIcon } from "../icones/end.svg";
import { ReactComponent as ResetIcon } from "../icones/reset.svg";
import { ReactComponent as PauseIcon } from "../icones/pause.svg";

import { ReactComponent as RainIcon } from "../icones/rain.svg";
import { ReactComponent as ForestIcon } from "../icones/forest.svg";
import { ReactComponent as PlaneIcon } from "../icones/plane.svg";
import { ReactComponent as FireIcon } from "../icones/fire.svg";
import { ReactComponent as MoonIcon } from "../icones/moon.svg";

import { ReactComponent as LogoIcon } from "../icones/icon.svg";

import { ReactComponent as SkipForwardIcon } from "../icones/skip-forward.svg";
import { ReactComponent as SkipBackwardIcon } from "../icones/skip-backward.svg";

import { ReactComponent as SoundIcon } from "../icones/sound.svg";
import { ReactComponent as SoundLowIcon } from "../icones/sound-low.svg";

// Import the audio file
import lightRainSound from "../../src/white-noises/rain.mp3";
import forestSound from "../../src/white-noises/forest.mp3";
import airportSound from "../../src/white-noises/airport.mp3";
import fireplace from "../../src/white-noises/fireplace.mp3";
import cricket from "../../src/white-noises/cricket.mp3";

import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

// Define sounds array with their properties
const sounds = [
  { name: "Light rain", src: lightRainSound, Icon: RainIcon },
  { name: "Forest ambience", src: forestSound, Icon: ForestIcon },
  { name: "Night cricket", src: cricket, Icon: MoonIcon },
  { name: "Fireplace", src: fireplace, Icon: FireIcon },
  { name: "Airport buzz", src: airportSound, Icon: PlaneIcon },
];

const TimerWhiteNoises = () => {
  const initialTime = 0 * 60 + 10; // Example: 4 min 32 seconds
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  // Add new state for overtime tracking
  const [isOvertime, setIsOvertime] = useState(false);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const notificationTimeoutsRef = useRef({});
  const timerIntervalRef = useRef(null);

  // White Noise Player State
  const audioRef = useRef(null);
  const [isNoisePlaying, setIsNoisePlaying] = useState(false);
  const fadeIntervalRef = useRef(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1); // Initial volume: 100%
  const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);
  const [isRepeatOn, setIsRepeatOn] = useState(false); // State for repeat functionality
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0); // Track current sound

  // Add new states for the notification popup
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const strokeWidth = 10;
  const ringSize = 270;
  const radius = ringSize / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  // Request notification permission on component mount
  useEffect(() => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
    } else if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Modify the existing useEffect for timer countdown
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      // Timer reached zero - switch to overtime mode
      clearInterval(timerIntervalRef.current);
      setIsOvertime(true);

      // Trigger desktop notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Timer Finished!", {
          body: "Your timer has reached zero.",
          icon: "../icones/icon.svg", // Optional: Add a path to an icon for the notification
        });
      } else if (
        "Notification" in window &&
        Notification.permission !== "denied"
      ) {
        // If permission hasn't been granted or denied yet, request it
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Timer Finished!", {
              body: "Your timer has reached zero.",
              icon: "../icones/icon.svg", // Optional: Add a path to an icon for the notification
            });
          }
        });
      }

      // Start the overtime counter
      timerIntervalRef.current = setInterval(() => {
        setOvertimeSeconds((prevSeconds) => {
          const newSeconds = prevSeconds + 1;
          // Check if overtime reaches 5 minutes (300 seconds)
          if (newSeconds >= 300) {
            clearInterval(timerIntervalRef.current);
            setIsActive(false); // Stop the timer
            setIsOvertime(false); // Exit overtime mode
            setOvertimeSeconds(0); // Reset overtime counter
            // Optionally, you might want to reset the main timer or show a message here
            // setTimeRemaining(initialTime); // Example: reset to initial time
          }
          return newSeconds;
        });
      }, 1000);
    } else if (!isActive) {
      clearInterval(timerIntervalRef.current);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isActive, timeRemaining, isOvertime]);

  // Timer functions
  const toggleTimer = () => {
    // Prevent toggling if in overtime
    if (isOvertime) return;
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    clearInterval(timerIntervalRef.current);
    setIsActive(false);
    setTimeRemaining(initialTime); // Reset to the current initialTime
  };

  const endTimer = () => {
    clearInterval(timerIntervalRef.current);
    setIsActive(false);
    setTimeRemaining(0);
    setIsOvertime(false);
    setOvertimeSeconds(0);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const isOvertimeDisplay = isOvertime;

    return (
      <>
        <span className={`minutes ${isOvertimeDisplay ? "overtime" : ""}`}>
          {String(minutes)}
        </span>
        <span className={`separator ${isOvertimeDisplay ? "overtime" : ""}`}>
          {" "}
          min{" "}
        </span>
        <span className={`seconds ${isOvertimeDisplay ? "overtime" : ""}`}>
          {String(secs).padStart(2, "0")}
        </span>
        <span className={`separator ${isOvertimeDisplay ? "overtime" : ""}`}>
          {" "}
          s
        </span>
      </>
    );
  };

  // This effect only handles setting up the audio source and progress tracking
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      // Set the current sound source
      audioElement.src = sounds[currentSoundIndex].src;
      audioElement.load();
    }

    const updateProgress = () => {
      if (audioElement && !isNaN(audioElement.duration)) {
        setAudioProgress(audioElement.currentTime);
        setAudioDuration(audioElement.duration);
      }
    };

    if (audioElement) {
      audioElement.addEventListener("timeupdate", updateProgress);
      audioElement.addEventListener("loadedmetadata", updateProgress);
      return () => {
        audioElement.removeEventListener("timeupdate", updateProgress);
        audioElement.removeEventListener("loadedmetadata", updateProgress);
      };
    }
  }, [currentSoundIndex]); // Only depend on sound changes

  // Separate effect to handle the repeat functionality
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleAudioEnd = () => {
      if (isRepeatOn) {
        audioElement.currentTime = 0;
        const playPromise = audioElement.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Playback started successfully
            })
            .catch((error) => {
              console.log("Play error on repeat:", error);
              setIsNoisePlaying(false);
            });
        }
        setIsNoisePlaying(true);
      } else {
        // Skip to the next sound when repeat is off
        const nextIndex = (currentSoundIndex + 1) % sounds.length;
        setCurrentSoundIndex(nextIndex);

        // Set the new source
        audioElement.src = sounds[nextIndex].src;
        audioElement.load();

        // Play the next sound
        const playPromise = audioElement.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Playback started successfully
            })
            .catch((error) => {
              console.log("Play error on next sound:", error);
              setIsNoisePlaying(false);
              return; // Don't proceed with state update
            });
        }

        // Update playing state to true
        setIsNoisePlaying(true);
      }
    };

    audioElement.addEventListener("ended", handleAudioEnd);

    return () => {
      audioElement.removeEventListener("ended", handleAudioEnd);
    };
  }, [isRepeatOn, currentSoundIndex, sounds]); // Added dependencies for the next sound functionality

  // Add a separate effect to handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleProgressChange = (event) => {
    if (audioRef.current) {
      const newTime = Number(event.target.value);
      audioRef.current.currentTime = newTime;
      setAudioProgress(newTime);
    }
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);

    if (audioRef.current) {
      // Store the current playing state and position before changing volume
      const wasPlaying = !audioRef.current.paused;
      const currentTime = audioRef.current.currentTime;

      // Set the new volume without affecting playback
      audioRef.current.volume = newVolume;

      // If it was playing but somehow paused due to volume change, restart it from the same position
      if (wasPlaying && audioRef.current.paused) {
        // Restore the playback position
        audioRef.current.currentTime = currentTime;

        // Play with promise handling
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Playback successfully resumed at the same position
              console.log("Playback resumed after volume change");
            })
            .catch((error) => {
              // Auto-play was prevented or another error occurred
              console.log("Play error after volume change:", error);
              // Update UI to reflect that audio isn't playing
              setIsNoisePlaying(false);
            });
        }
      }
    }
  };

  // Toggle repeat functionality
  const handleRepeat = () => {
    // Update repeat state
    const newRepeatState = !isRepeatOn;
    setIsRepeatOn(newRepeatState);

    // Create a new notification with unique ID
    const notificationId = Date.now();
    const newNotification = {
      id: notificationId,
      message: newRepeatState ? "Repeat Activated" : "Repeat Deactivated",
    };

    // Add the new notification to the array (limit to 3)
    setNotifications((prevNotifications) => {
      // If we already have 3 notifications, remove the oldest one
      const updatedNotifications = [...prevNotifications];
      if (updatedNotifications.length >= 3) {
        const oldestId = updatedNotifications[0].id;
        // Clear the timeout for the oldest notification
        if (notificationTimeoutsRef.current[oldestId]) {
          clearTimeout(notificationTimeoutsRef.current[oldestId]);
          delete notificationTimeoutsRef.current[oldestId];
        }
        updatedNotifications.shift(); // Remove the oldest notification
      }
      return [...updatedNotifications, newNotification];
    });

    // Set timeout to remove this specific notification
    notificationTimeoutsRef.current[notificationId] = setTimeout(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => notification.id !== notificationId
        )
      );
      delete notificationTimeoutsRef.current[notificationId];
    }, 2000);

    console.log("Repeat clicked, state:", newRepeatState);
  };

  // Change to next sound
  const handleNextSound = () => {
    // Store the next index
    const nextIndex = (currentSoundIndex + 1) % sounds.length;

    // If currently playing, we need to handle the promise properly
    if (isNoisePlaying && audioRef.current) {
      // First pause the current audio
      audioRef.current.pause();
      // Update the index
      setCurrentSoundIndex(nextIndex);
      // Set the new source
      audioRef.current.src = sounds[nextIndex].src;
      // Load the audio
      audioRef.current.load();
      // Play with promise handling
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Playback started successfully
          })
          .catch((error) => {
            // Auto-play was prevented or another error occurred
            console.log("Play error:", error);
            // Update UI to reflect that audio isn't playing
            setIsNoisePlaying(false);
          });
      }
    } else {
      // If not playing, just update the source
      setCurrentSoundIndex(nextIndex);
      if (audioRef.current) {
        audioRef.current.src = sounds[nextIndex].src;
        audioRef.current.load();
      }
    }
  };

  const handlePreviousSound = () => {
    // Store the previous index
    const prevIndex = (currentSoundIndex - 1 + sounds.length) % sounds.length;

    // If currently playing, we need to handle the promise properly
    if (isNoisePlaying && audioRef.current) {
      // First pause the current audio
      audioRef.current.pause();
      // Update the index
      setCurrentSoundIndex(prevIndex);
      // Set the new source
      audioRef.current.src = sounds[prevIndex].src;
      // Load the audio
      audioRef.current.load();
      // Play with promise handling
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Playback started successfully
          })
          .catch((error) => {
            // Auto-play was prevented or another error occurred
            console.log("Play error:", error);
            // Update UI to reflect that audio isn't playing
            setIsNoisePlaying(false);
          });
      }
    } else {
      // If not playing, just update the source
      setCurrentSoundIndex(prevIndex);
      if (audioRef.current) {
        audioRef.current.src = sounds[prevIndex].src;
        audioRef.current.load();
      }
    }
  };

  // Also update the toggleWhiteNoise function to handle promises
  const toggleWhiteNoise = () => {
    if (audioRef.current) {
      clearInterval(fadeIntervalRef.current);
      if (isNoisePlaying) {
        let currentVolume = audioRef.current.volume;
        fadeIntervalRef.current = setInterval(() => {
          currentVolume -= 0.05;
          if (currentVolume <= 0) {
            audioRef.current.volume = 0;
            audioRef.current.pause();
            clearInterval(fadeIntervalRef.current);
          } else {
            audioRef.current.volume = currentVolume;
          }
        }, 30);
      } else {
        audioRef.current.volume = 0; // Start at 0 for fade-in
        // Ensure current component volume state matches audio element before playing
        if (audioRef.current.volume !== volume) {
          audioRef.current.volume = volume;
        }

        // Play with promise handling
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Start the fade-in once playback has successfully started
              let currentVolumeSetting = volume; // Target volume for fade-in
              let actualVolume = 0; // Start fade from 0
              audioRef.current.volume = actualVolume;

              fadeIntervalRef.current = setInterval(() => {
                actualVolume += 0.05;
                if (actualVolume >= currentVolumeSetting) {
                  audioRef.current.volume = currentVolumeSetting;
                  clearInterval(fadeIntervalRef.current);
                } else {
                  audioRef.current.volume = actualVolume;
                }
              }, 30);
            })
            .catch((error) => {
              // Auto-play was prevented or another error occurred
              console.log("Play error:", error);
              // Update UI to reflect that audio isn't playing
              setIsNoisePlaying(false);
              return; // Don't proceed with state update
            });
        }
      }
      setIsNoisePlaying(!isNoisePlaying);
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(fadeIntervalRef.current);
    };
  }, []);

  const getProgressBarStyle = () => {
    if (!audioDuration) return {};
    const percentage = (audioProgress / audioDuration) * 100;
    return {
      background: `linear-gradient(to right, #119DFF 0%, #119DFF ${percentage}%, #181A1C ${percentage}%, #181A1C 100%)`,
    };
  };

  // Get current sound icon component
  const CurrentSoundIcon = sounds[currentSoundIndex].Icon;

  return (
    <div className="tasks-main-content-left-column">
      {/* Show notification popup when showNotification is true */}
      {showNotification && (
        <div className="notification-popup">{notificationMessage}</div>
      )}

      <div className="timer-section">
        <div className="timer-display-container">
          <svg
            className="timer-progress-ring"
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
          >
            <defs>
              {/* Create gradient for the progress arc */}
              <linearGradient id="arcGradient" gradientUnits="userSpaceOnUse">
                <stop
                  offset="0%"
                  stopColor={
                    isOvertime
                      ? "rgba(255, 59, 48, 0)"
                      : "rgba(17, 157, 255, 0)"
                  }
                />
                <stop
                  offset="70%"
                  stopColor={
                    isOvertime
                      ? "rgba(255, 59, 48, 0.5)"
                      : "rgba(17, 157, 255, 0.5)"
                  }
                />
                <stop
                  offset="100%"
                  stopColor={isOvertime ? "#FF3B30" : "#119DFF"}
                />
              </linearGradient>

              {/* Add filter for glow effect */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background circle */}
            <circle
              className="timer-progress-ring__background"
              strokeWidth={strokeWidth}
              fill="transparent"
              r={radius}
              cx={ringSize / 2}
              cy={ringSize / 2}
            />

            {/* Main progress circle */}
            <circle
              className="timer-progress-ring__progress"
              strokeWidth={strokeWidth}
              fill="transparent"
              r={radius}
              cx={ringSize / 2}
              cy={ringSize / 2}
              style={{
                stroke: "url(#arcGradient)",
                strokeLinecap: "round",
                strokeDasharray: circumference,
                strokeDashoffset: isOvertime
                  ? 0
                  : circumference * (1 - timeRemaining / initialTime),
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                transition: "stroke-dashoffset 0.35s linear",
                filter: "url(#glow)",
              }}
            />

            {/* The dot at the end of the progress */}
            <circle
              className={`timer-progress-dot ${isOvertime ? "overtime" : ""}`}
              r={6}
              fill={isOvertime ? "#FF3B30" : "#119DFF"}
              style={{
                filter: `drop-shadow(0 0 5px ${
                  isOvertime
                    ? "rgba(255, 59, 48, 0.8)"
                    : "rgba(17, 157, 255, 0.8)"
                })`,
                transform: isOvertime
                  ? `rotate(${
                      (360 * (overtimeSeconds % 60)) / 60 - 90
                    }deg) translate(${radius}px, 0)`
                  : `rotate(${
                      360 * (timeRemaining / initialTime) - 90
                    }deg) translate(${radius}px, 0)`,
                transformOrigin: "center",
                transition: "transform 0.35s linear",
              }}
              cx={ringSize / 2}
              cy={ringSize / 2}
            />
          </svg>
          <div className="timer-text-content">
            <div
              className={`timer-remaining-label ${
                isOvertime ? "overtime" : ""
              }`}
            >
              {isOvertime ? "Overtime" : "Remaining"}
            </div>
            <div className="timer-time">
              {isOvertime
                ? formatTime(overtimeSeconds)
                : formatTime(timeRemaining)}
            </div>
          </div>
        </div>
        <div className="timer-controls">
          <button onClick={resetTimer} className="timer-button reset-button">
            <ResetIcon className="reset-icon" /> Reset
          </button>
          <button
            onClick={toggleTimer}
            className={`start-pause-button ${isActive ? "pause" : "start"} ${
              isOvertime ? "disabled" : ""
            }`}
            disabled={isOvertime}
          >
            {isActive ? <PauseIcon /> : <StartIcon className="start-icon" />}{" "}
            {isActive ? "Pause" : "Start"}{" "}
          </button>
          <button
            onClick={endTimer}
            className={`timer-button end-button ${
              isOvertime ? "overtime" : ""
            }`}
          >
            <EndIcon className={`end-icon ${isOvertime ? "overtime" : ""}`} />{" "}
            End
          </button>
        </div>
      </div>

      <div className="white-noise-player">
        <div className="white-noise-player-hero">
          <CurrentSoundIcon className="white-noise-player-icon" />
          <div className="white-noise-player-text">
            <p className="white-noise-player-title">White noises</p>
            <p className="white-noise-player-playing">
              {sounds[currentSoundIndex].name}
            </p>
          </div>
        </div>
        <div className="white-noise-progress-bar-container">
          <input
            type="range"
            min="0"
            max={audioDuration || 0}
            value={audioProgress}
            onChange={handleProgressChange}
            className="white-noise-progress-bar"
            style={getProgressBarStyle()}
          />
        </div>
        <div className="white-noise-controls">
          <div
            className="control-button volume-control-container"
            onMouseEnter={() => setIsVolumeSliderVisible(true)}
            onMouseLeave={() => setIsVolumeSliderVisible(false)}
          >
            <div className="sound-icon-wrapper">
              {volume < 0.4 ? (
                <SoundLowIcon className="control-button-secondary" />
              ) : (
                <SoundIcon className="control-button-secondary" />
              )}
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
          </div>
          <button onClick={handlePreviousSound} className="control-button">
            <SkipBackwardIcon />
          </button>
          <button
            onClick={toggleWhiteNoise}
            className="control-button play-pause-main-button"
          >
            {isNoisePlaying ? (
              <PauseIcon className="pause-play-icon" />
            ) : (
              <StartIcon className="pause-play-icon" />
            )}
          </button>
          <button onClick={handleNextSound} className="control-button">
            <SkipForwardIcon />
          </button>
          <ResetIcon
            onClick={handleRepeat}
            className={`control-button-secondary ${isRepeatOn ? "active" : ""}`}
          />
        </div>
        <audio ref={audioRef} />
      </div>
      <div className="tasks-main-content-left-column">
        {/* Render stacked notifications */}
        <div className="notifications-container">
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className="notification-popup"
              style={{ bottom: `${30 + index * 50}px` }} // Stack notifications with 50px spacing
            >
              {notification.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimerWhiteNoises;

// Update the JSX to render multiple notifications
