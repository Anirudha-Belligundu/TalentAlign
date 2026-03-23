import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";
import Upload from "./pages/Upload";
import Results from "./pages/Results";

// Redirect to /login if JWT token not present
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                           element={<Navigate to="/login" />} />
        <Route path="/login"                      element={<Login />} />
        <Route path="/signup"                     element={<Signup />} />
        <Route path="/dashboard"                  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/projects/new"               element={<PrivateRoute><CreateProject /></PrivateRoute>} />
        <Route path="/projects/:projectId/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
        <Route path="/projects/:projectId/results"element={<PrivateRoute><Results /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
