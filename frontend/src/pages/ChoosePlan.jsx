import React from "react";
import { useNavigate } from "react-router-dom";
import "./ChoosePlan.css";

const ChoosePlan = () => {
  const navigate = useNavigate();

  const handleSelect = (plan) => {
    localStorage.setItem("user_plan", plan);
    navigate("/dashboard");
  };

  return (
    <div className="pricing-container">

      <h1>Choose Your Plan</h1>
      <p>Select a plan that fits your hiring needs</p>

      <div className="pricing-grid">

        {/* FREE */}
        <div className="plan-card">
          <h2>Free</h2>
          <h3>₹0</h3>

          <ul>
            <li>✔ 10 resumes/month</li>
            <li>✔ Basic AI matching</li>
            <li>✔ Limited features</li>
          </ul>

          <button onClick={() => handleSelect("Free")}>
            Get Started
          </button>
        </div>

        {/* PRO (HIGHLIGHT) */}
        <div className="plan-card highlight">
          <h2>Pro</h2>
          <h3>₹499/month</h3>

          <ul>
            <li>✔ 200 resumes/month</li>
            <li>✔ Advanced AI ranking</li>
            <li>✔ Priority support</li>
          </ul>

          <button onClick={() => handleSelect("Pro")}>
            Choose Pro
          </button>
        </div>

        {/* PREMIUM */}
        <div className="plan-card">
          <h2>Premium</h2>
          <h3>₹999/month</h3>

          <ul>
            <li>✔ Unlimited resumes</li>
            <li>✔ Best AI accuracy</li>
            <li>✔ Full features access</li>
          </ul>

          <button onClick={() => handleSelect("Premium")}>
            Go Premium
          </button>
        </div>

      </div>

      {/* SKIP */}
      <button onClick={() => {
  localStorage.setItem("user_plan", "Free"); // default
  navigate("/dashboard");
}}>
        Skip for now
      </button>

    </div>
  );
};

export default ChoosePlan;