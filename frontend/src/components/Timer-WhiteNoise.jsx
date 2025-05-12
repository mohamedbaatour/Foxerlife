import React, { useState, useEffect, useRef } from 'react';
import './Timer-WhiteNoise.css'; 
import { ReactComponent as StartIcon } from "../icones/start.svg";
import { ReactComponent as EndIcon } from "../icones/end.svg";
import { ReactComponent as ResetIcon } from "../icones/reset.svg";
import { ReactComponent as PauseIcon } from "../icones/pause.svg";

import { ReactComponent as RainIcon } from "../icones/rain.svg";
import { ReactComponent as ForestIcon } from "../icones/forest.svg";
import { ReactComponent as PlaneIcon } from "../icones/plane.svg";
import { ReactComponent as FireIcon } from "../icones/fire.svg";
import { ReactComponent as MoonIcon } from "../icones/moon.svg";

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

// Define sounds array with their properties
const sounds = [
  { name: "Light rain", src: lightRainSound, Icon: RainIcon },
  { name: "Forest ambience", src: forestSound, Icon: ForestIcon },
  { name: "Night cricket", src: cricket, Icon: MoonIcon },
  { name: "Fireplace", src: fireplace, Icon: FireIcon },
  { name: "Airport buzz", src: airportSound, Icon: PlaneIcon },
];

const TimerWhiteNoises = () => {
  const initialTime = 4 * 60 + 32; // Example: 4 min 32 seconds
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
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

  const strokeWidth = 10;
  const ringSize = 270;
  const radius = ringSize / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0 || !isActive) {
      clearInterval(timerIntervalRef.current);
      if (timeRemaining === 0 && isActive) {
        console.log("Timer finished!");
        setIsActive(false);
      }
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isActive, timeRemaining]);

  // Timer functions
  const toggleTimer = () => {
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
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return (
      <>
        <span className="minutes">{String(minutes)}</span>
        <span className="separator"> min </span>
        <span className="seconds">{String(secs).padStart(2, "0")}</span>
        <span className="separator"> s</span>
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
            .catch(error => {
              console.log("Play error on repeat:", error);
              setIsNoisePlaying(false);
            });
        }
        setIsNoisePlaying(true);
      } else {
        setIsNoisePlaying(false);
        setAudioProgress(0);
      }
    };
    
    audioElement.addEventListener("ended", handleAudioEnd);
    
    return () => {
      audioElement.removeEventListener("ended", handleAudioEnd);
    };
  }, [isRepeatOn]); // Only depend on repeat changes
  
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
            .catch(error => {
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
    // Simply update the state without affecting audio playback
    setIsRepeatOn(!isRepeatOn);
    console.log("Repeat clicked, state:", !isRepeatOn);
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
          .catch(error => {
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
          .catch(error => {
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
            .catch(error => {
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
      <div className="timer-section">
        <div className="timer-display-container">
          <svg
            className="timer-progress-ring"
            width={ringSize}
            height={ringSize}
          >
            <defs>
              <linearGradient
                id="timerGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style={{ stopColor: "#119DFF", stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: "#0056b3", stopOpacity: 1 }}
                />
              </linearGradient>
            </defs>
            <circle
              className="timer-progress-ring__background"
              strokeWidth={strokeWidth}
              fill="transparent"
              r={radius}
              cx={ringSize / 2}
              cy={ringSize / 2}
            />
            <circle
              className="timer-progress-ring__progress"
              strokeWidth={strokeWidth}
              fill="transparent"
              r={radius}
              cx={ringSize / 2}
              cy={ringSize / 2}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset:
                  circumference * (1 - timeRemaining / initialTime),
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                transition: "stroke-dashoffset 0.35s linear",
              }}
            />
          </svg>
          <div className="timer-text-content">
            <div className="timer-remaining-label">Remaining</div>
            <div className="timer-time">{formatTime(timeRemaining)}</div>
          </div>
        </div>
        <div className="timer-controls">
          <button onClick={resetTimer} className="timer-button reset-button">
            <ResetIcon className="reset-icon" /> Reset
          </button>
          <button
            onClick={toggleTimer}
            className={`start-pause-button ${isActive ? "pause" : "start"}`}
          >
            {isActive ? <PauseIcon /> : <StartIcon className="start-icon" />}{" "}
            {isActive ? "Pause" : "Start"}{" "}
          </button>
          <button onClick={endTimer} className="timer-button end-button">
            <EndIcon className="end-icon" /> End
          </button>
        </div>
      </div>

      <div className="white-noise-player">
        <div className="white-noise-player-hero">
          <CurrentSoundIcon className="white-noise-player-icon" />
          <div className="white-noise-player-text">
            <p className="white-noise-player-title">White noises</p>
            <p className="white-noise-player-playing">{sounds[currentSoundIndex].name}</p>
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
            className={`control-button-secondary ${isRepeatOn ? 'active' : ''}`}
          />
        </div>
        <audio ref={audioRef} />
      </div>
    </div>
  );
};

export default TimerWhiteNoises;

