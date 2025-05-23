import logo from './logo.svg';
import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Switch, Route, Routes } from 'react-router-dom';
import Tasks from './pages/Tasks';
import Stats from './pages/Stats';

function App() {
  return (
    <div className="App">
      <Navbar />
       
          <Routes>
        <Route path="/" element={<Tasks />} />
        <Route path="/stats" element={<Stats />} />
        </Routes>
    </div>
  );
}

export default App;
