import logo from './logo.svg';
import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Switch, Route, Routes } from 'react-router-dom';
import Tasks from './pages/Tasks';
import TimerWhiteNoises from './components/Timer-WhiteNoise';

function App() {
  return (
    <div className="App">
      <Navbar />
       
          <Routes>
        <Route path="/" element={<Tasks />} />
        </Routes>
    </div>
  );
}

export default App;
