import React, { useState, useEffect, useRef } from 'react';
import './Tasks.css'; 
import TimerWhiteNoises from '../components/Timer-WhiteNoise.jsx';

const Tasks = () => {
    const initialTime = 12 * 60 + 32; // 12 min 32 seconds from image
    const [timeRemaining, setTimeRemaining] = useState(initialTime);
    const [isActive, setIsActive] = useState(false);
    const timerIntervalRef = useRef(null);

    const strokeWidth = 12;
    const ringSize = 270;

    return (
      <div>
        <TimerWhiteNoises />
      </div>
    );
}

export default Tasks;