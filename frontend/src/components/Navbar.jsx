import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import { ReactComponent as LogoIcon } from "../icones/icon.svg";
import { ReactComponent as SettingsIcon } from "../icones/settings.svg";
import { ReactComponent as StatsIcon } from "../icones/stats.svg";
import { ReactComponent as TaskIcon } from "../icones/task.svg";
import LogoGIF from "../icones/iconGIF.gif"; // Changed import
// Import weather icons as React Components for consistency and potential styling
import { ReactComponent as CloudIcon } from "../icones/cloud.svg";
import { ReactComponent as RainIcon } from "../icones/rain.svg";
import { ReactComponent as SunIcon } from "../icones/sun.svg";
// You might want to add more icons like Snow, Thunderstorm, etc.

const Navbar = () => {
  const [location, setLocation] = useState("Loading...");
  const [currentTime, setCurrentTime] = useState("");
  const [weatherIcon, setWeatherIcon] = useState(<CloudIcon />); // Default icon
  const [weatherDescription, setWeatherDescription] = useState(""); // For alt text or tooltips
  const [isLogoHovered, setIsLogoHovered] = useState(false); // New state for logo hover

  const getLinkClassName = ({ isActive }) => {
    return isActive ? "navbar-menu-link active" : "navbar-menu-link";
  };

  useEffect(() => {
    const fetchWeatherData = async (latitude, longitude) => {
      // Add current_weather=true and request weathercode from Open-Meteo
      const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m`; // Added current_weather=true
      console.log(latitude, longitude);
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch weather data from Open-Meteo");
        }
        const data = await response.json();

        // --- Logic for Open-Meteo ---
        if (
          data &&
          data.current_weather &&
          data.current_weather.weathercode !== undefined
        ) {
          const weatherCode = data.current_weather.weathercode;
          setWeatherDescription(getWeatherDescriptionForCode(weatherCode)); // Optional: set a text description

          // Map WMO weather codes to icons
          // This is a simplified mapping. Refer to Open-Meteo docs for full WMO code list.
          // WMO Weather interpretation codes (WW)
          // Code | Description
          // 0    | Clear sky
          // 1, 2, 3 | Mainly clear, partly cloudy, and overcast
          // 45, 48 | Fog and depositing rime fog
          // 51, 53, 55 | Drizzle: Light, moderate, and dense intensity
          // 56, 57 | Freezing Drizzle: Light and dense intensity
          // 61, 63, 65 | Rain: Slight, moderate and heavy intensity
          // 66, 67 | Freezing Rain: Light and heavy intensity
          // 71, 73, 75 | Snow fall: Slight, moderate, and heavy intensity
          // 77       | Snow grains
          // 80, 81, 82 | Rain showers: Slight, moderate, and violent
          // 85, 86 | Snow showers slight and heavy
          // 95 *     | Thunderstorm: Slight or moderate
          // 96, 99 * | Thunderstorm with slight and heavy hail
          // (* WMO code 95, 96, 99 are usually for thunderstorms)

          if (weatherCode === 0) {
            // Clear sky
            setWeatherIcon(<SunIcon className="weather-icon-svg" />);
          } else if ([1, 2, 3].includes(weatherCode)) {
            // Mainly clear, partly cloudy, overcast
            setWeatherIcon(<CloudIcon className="weather-icon-svg" />);
          } else if (
            [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(
              weatherCode
            )
          ) {
            // Drizzle, Rain, Freezing Rain, Rain showers
            setWeatherIcon(<RainIcon className="weather-icon-svg" />);
          } else if ([45, 48].includes(weatherCode)) {
            // Fog
            setWeatherIcon(<CloudIcon className="weather-icon-svg" />); // Using CloudIcon for Fog, you might want a specific Fog icon
          } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
            // Snow related
            // You'll need to import a SnowIcon for this
            // import { ReactComponent as SnowIcon } from "../icones/snow.svg";
            // setWeatherIcon(<SnowIcon className="weather-icon-svg" />);
            setWeatherIcon(<CloudIcon className="weather-icon-svg" />); // Fallback to Cloud if no SnowIcon
          } else if ([95, 96, 99].includes(weatherCode)) {
            // Thunderstorm
            // You'll need to import a ThunderstormIcon for this
            // import { ReactComponent as ThunderstormIcon } from "../icones/thunderstorm.svg";
            // setWeatherIcon(<ThunderstormIcon className="weather-icon-svg" />);
            setWeatherIcon(<RainIcon className="weather-icon-svg" />); // Fallback to Rain if no ThunderstormIcon
          } else {
            setWeatherIcon(<CloudIcon className="weather-icon-svg" />); // Default/fallback
          }
        } else {
          // Fallback if weathercode is not available
          setWeatherDescription("Weather data unavailable");
          setWeatherIcon(<CloudIcon className="weather-icon-svg" />);
        }
      } catch (error) {
        console.error("Error fetching or processing weather data:", error);
        setWeatherDescription("Error");
        setWeatherIcon(<CloudIcon className="weather-icon-svg" />);
      }
    };

    // Helper function to get a text description (optional)
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
        // Add more as needed from WMO code list
      };
      return descriptions[code] || "Weather status unknown";
    };

    const fetchWeatherByIP = async () => {
      setLocation("Fetching location by IP...");
      try {
        const ipGeoResponse = await fetch("http://ip-api.com/json");
        if (!ipGeoResponse.ok) {
          throw new Error("Failed to fetch IP geolocation data");
        }
        const ipGeoData = await ipGeoResponse.json();
        console.log("IP Geolocation Data:", ipGeoData);

        const cityName = ipGeoData.city || "Unknown City";
        const countryName = ipGeoData.country || "Unknown Country";
        setLocation(`${cityName}, ${countryName}`);

        if (ipGeoData.status === "success" && ipGeoData.lat && ipGeoData.lon) {
          fetchWeatherData(ipGeoData.lat, ipGeoData.lon);
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
      const localTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentTime(localTime);
    };

    // Fetch weather once
    fetchWeatherByIP();

    // Set and update time every minute
    updateLocalTime(); // Set initially
    const intervalId = setInterval(updateLocalTime, 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <nav className="navbar-main">
      <div 
        className="navbar-left-section"
        onMouseEnter={() => setIsLogoHovered(true)}
        onMouseLeave={() => setIsLogoHovered(false)}
      >
        {isLogoHovered ? <img src={LogoGIF} alt="Foxerlife Animated Logo" className="logo" /> : <LogoIcon className="logo" />}
        <div className="navbar-brand-name">Foxerlife</div>
      </div>

      <ul className="navbar-center-section">
        <li className="navbar-menu-item">
          <NavLink to="/" className={getLinkClassName}>
            <TaskIcon className="navbar-menu-icon" />
            Tasks
          </NavLink>
        </li>
        <li className="navbar-menu-item">
          <NavLink to="/stats" className={getLinkClassName}>
            <StatsIcon className="navbar-menu-icon" />
            Stats
          </NavLink>
        </li>
        <li className="navbar-menu-item">
          <NavLink to="/settings" className={getLinkClassName}>
            <SettingsIcon className="navbar-menu-icon" />
            Settings
          </NavLink>
        </li>
      </ul>

      <div className="navbar-right-section">
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
