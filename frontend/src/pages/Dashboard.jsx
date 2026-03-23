import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import ProjectCard from "../components/ProjectCard";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const DEMO_PROJECTS = [
    { id: 1, title: "Senior Software Engineer – Bangalore", created_at: "2026-03-10T10:00:00", candidate_count: 12 },
    { id: 2, title: "Data Scientist – Remote",              created_at: "2026-03-12T09:00:00", candidate_count: 7  },
    { id: 3, title: "Frontend Developer – Mumbai",          created_at: "2026-03-15T11:00:00", candidate_count: 5  },
  ];

  useEffect(() => {
    // Try real backend first; fall back to demo data if unavailable
    api.get("/projects/")
      .then((res) => setProjects(res.data))
      .catch(() => setProjects(DEMO_PROJECTS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">

        <div className="dashboard-header">
          <div>
            <h1>My Job Projects</h1>
            <p>Manage your job openings and candidate rankings</p>
          </div>
          <button className="btn-create" onClick={() => navigate("/projects/new")}>
            + New Project
          </button>
        </div>

        {loading && (
          <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>Loading projects...</p>
          </div>
        )}

        {error && <div className="dashboard-error">{error}</div>}

        {!loading && !error && projects.length === 0 && (
          <div className="dashboard-empty">
            <div className="empty-icon">📋</div>
            <h3>No projects yet</h3>
            <p>Create your first job project to start matching candidates.</p>
            <button className="btn-create" onClick={() => navigate("/projects/new")}>
              + Create First Project
            </button>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
