import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ClassDetail from './components/ClassDetail';
import ViewAttendance from './components/ViewAttendance';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Login />} />
        <Route path="/class/:classId" element={<ClassDetail />} />
        <Route path="/viewattendance/:classId" element={<ViewAttendance />} />
      </Routes>
    </Router>
  );
}

export default App;
