import React, { useState, useEffect, useRef } from 'react';
import './Tasks.css'; 
import TimerWhiteNoises from '../components/Timer-WhiteNoise.jsx';

const Tasks = () => {
const [tasks, setTasks] = useState([]);

  return (
    <div className="tasks-page-container">
      <div className="left-section">
        <TimerWhiteNoises />
      </div>
      <div className="right-section">
        <h1>Now</h1>
      </div>
    </div>
  );
}

export default Tasks;