import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate("/dashboard")}>
        <div className="navbar-logo">TA</div>
        <span>TalentAlign AI</span>
      </div>

      <div className="navbar-links">
        <span
          className={`navbar-link ${isActive("/dashboard") ? "active" : ""}`}
          onClick={() => navigate("/dashboard")}
        >
          🏠 Dashboard
        </span>
        <span
          className={`navbar-link ${isActive("/support") ? "active" : ""}`}
          onClick={() => navigate("/support/tickets")}
        >
          🎫 Support
        </span>
      </div>

      <button className="navbar-logout" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
};

export default Navbar;