import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate("/dashboard")}>
        <div className="navbar-logo">TA</div>
        <span>TalentAlign AI</span>
      </div>
      <button className="navbar-logout" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
};

export default Navbar;
