import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import LogoIcon from "../icones/foxidle3.png";
import { ReactComponent as SettingsIcon } from "../icones/settings.svg";
import { ReactComponent as StatsIcon } from "../icones/stats.svg";
import { ReactComponent as TaskIcon } from "../icones/task.svg";
import LogoGIF from "../icones/iconGIF.gif";
import { ReactComponent as CloudIcon } from "../icones/cloud.svg";
import { ReactComponent as RainIcon } from "../icones/rain.svg";
import { ReactComponent as SunIcon } from "../icones/sun.svg";
import { ReactComponent as SnowIcon } from "../icones/snow.svg";
import { ReactComponent as HamburgerIcon } from "../icones/hamburger.svg";

import {motion , AnimatePresence} from "framer-motion";

const Navbar = () => {
  const [location, setLocation] = useState("Loading...");
  const [currentTime, setCurrentTime] = useState("");
  const [weatherIcon, setWeatherIcon] = useState(<CloudIcon />);
  const [weatherDescription, setWeatherDescription] = useState("");
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  const getLinkClassName = ({ isActive }) => {
    return isActive ? "navbar-menu-link active" : "navbar-menu-link";
  };

  useEffect(() => {
    const fetchWeatherData = async (latitude, longitude) => {
      const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m`;
      console.log(latitude, longitude);
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch weather data from Open-Meteo");
        }
        const data = await response.json();

        if (
          data &&
          data.current_weather &&
          data.current_weather.weathercode !== undefined
        ) {
          const weatherCode = data.current_weather.weathercode;
          setWeatherDescription(getWeatherDescriptionForCode(weatherCode));

          if (weatherCode === 0) {
            setWeatherIcon(<SunIcon className="weather-icon-svg" />);
          } else if ([1, 2].includes(weatherCode)) {
            setWeatherIcon(<SunIcon className="weather-icon-svg" />);
          } else if (weatherCode === 3) {
            setWeatherIcon(<CloudIcon className="weather-icon-svg" />);
          } else if (
            [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(
              weatherCode
            )
          ) {
            setWeatherIcon(<RainIcon className="weather-icon-svg" />);
          } else if ([45, 48].includes(weatherCode)) {
            setWeatherIcon(<CloudIcon className="weather-icon-svg" />); 
          } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
            setWeatherIcon(<SnowIcon className="weather-icon-svg" />);
          } else if ([95, 96, 99].includes(weatherCode)) {
            setWeatherIcon(<RainIcon className="weather-icon-svg" />); 
          } else {
            setWeatherIcon(<CloudIcon className="weather-icon-svg" />); 
          }
        } else {
          setWeatherDescription("Weather data unavailable");
          setWeatherIcon(<CloudIcon className="weather-icon-svg" />);
        }
      } catch (error) {
        console.error("Error fetching or processing weather data:", error);
        setWeatherDescription("Error");
        setWeatherIcon(<CloudIcon className="weather-icon-svg" />);
      }
    };

    const getWeatherDescriptionForCode = (code) => {
      const descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
      };
      return descriptions[code] || "Weather status unknown";
    };

    const fetchWeatherByIP = async () => {
      setLocation("Fetching location...");
      try {
        const ipGeoResponse = await fetch("https://ipwho.is/");
        if (!ipGeoResponse.ok) {
          throw new Error("Failed to fetch IP geolocation data");
        }
        const ipGeoData = await ipGeoResponse.json();
        console.log("IP Geolocation Data:", ipGeoData);

        if (
          ipGeoData.country === "Israel" || 
          ipGeoData.country_code === "IL"
        ) {
          setLocation("Palestine.");
          return;
        }

        const cityName = ipGeoData.city || "Unknown City";
        const countryName = ipGeoData.country || "Unknown Country";
        setLocation(`${cityName}, ${countryName}`);

        if (ipGeoData.success && ipGeoData.latitude && ipGeoData.longitude) {
          fetchWeatherData(ipGeoData.latitude, ipGeoData.longitude);
        } else {
          throw new Error(
            `IP geolocation failed: ${
              ipGeoData.message || "Invalid coordinates or status."
            }`
          );
        }
      } catch (error) {
        console.error("Error fetching weather data by IP:", error);
        setLocation("Location N/A");
        setWeatherIcon(<CloudIcon className="weather-icon-svg" />);
      }
    };

    const updateLocalTime = () => {
      const storedTimeFormat = localStorage.getItem('timeFormat');
      const hour12 = storedTimeFormat === '12';

      const localTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: hour12,
      });
      setCurrentTime(localTime);
    };

    fetchWeatherByIP();

    updateLocalTime(); // Set initially
    const intervalId = setInterval(updateLocalTime, 60 * 1000);

    const handleStorageChange = (event) => {
      if (event.key === 'timeFormat') {
        updateLocalTime();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close menu on navigation (mobile) and on click outside
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest(".navbar-hamburger")
      ) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", () => setIsMenuOpen(false));
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", () => setIsMenuOpen(false));
    };
  }, [isMenuOpen]);

  return (
    <nav className="navbar-main">
      <div
        className="navbar-left-section"
        onMouseEnter={() => setIsLogoHovered(true)}
        onMouseLeave={() => setIsLogoHovered(false)}
      >
        {isLogoHovered ? (
          <img
            src={LogoGIF}
            alt="Foxerlife Animated Logo"
            className="animated-logo"
          />
        ) : (
          <img
            src={LogoIcon}
            alt="Foxerlife Logo"
            className="logo"
          />
        )}
        <p className="navbar-brand-name">Foxerlife</p>
        <p className="navbar-brand-version">BETA</p>
      </div>

      {/* Hamburger for mobile */}
      <div className="navbar-hamburger" onClick={() => setIsMenuOpen((v) => !v)}>
        <HamburgerIcon />
      </div>

      {/* Desktop menu */}
      <ul className="navbar-center-section">
        <li className="navbar-menu-item">
          <div className="tooltip">1</div>
          <NavLink to="/" className={getLinkClassName}>
            <TaskIcon className="navbar-menu-icon" />
            Tasks
          </NavLink>
        </li>
        <li className="navbar-menu-item">
          <div className="tooltip">2</div>
          <NavLink to="/stats" className={getLinkClassName}>
            <StatsIcon className="navbar-menu-icon" />
            Stats
          </NavLink>
        </li>
        <li className="navbar-menu-item">
          <div className="tooltip">3</div>
          <NavLink to="/settings" className={getLinkClassName}>
            <SettingsIcon className="navbar-menu-icon" />
            Settings
          </NavLink>
        </li>
      </ul>

      {/* Mobile menu drawer */}
      <AnimatePresence>
      {isMenuOpen && (
        <motion.div 
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.3 }}
        className="navbar-mobile-menu"
        ref={mobileMenuRef}>
          <NavLink to="/" className={getLinkClassName} onClick={() => setIsMenuOpen(false)}>
            <TaskIcon className="navbar-menu-icon" />
            Tasks
          </NavLink>
          <NavLink to="/stats" className={getLinkClassName} onClick={() => setIsMenuOpen(false)}>
            <StatsIcon className="navbar-menu-icon" />
            Stats
          </NavLink>
          <NavLink to="/settings" className={getLinkClassName} onClick={() => setIsMenuOpen(false)}>
            <SettingsIcon className="navbar-menu-icon" />
            Settings
          </NavLink>
        </motion.div>
      )}
      </AnimatePresence>

      <div className="navbar-right-section navbar-hide-mobile">
        {weatherIcon}
        <div className="navbar-time-details">
          <span className="navbar-current-time">{currentTime || "N/A"}</span>{" "}
          <br />
          <span className="navbar-current-location">{location}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
