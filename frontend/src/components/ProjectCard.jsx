import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProjectCard.css";

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  return (
    <div className="project-card">
      <div className="project-card-header">
        <div className="project-icon">💼</div>
        <div className="project-meta">
          <h3>{project.title}</h3>
          <span className="project-date">Created {formatDate(project.created_at)}</span>
        </div>
      </div>

      <div className="project-stats">
        <span className="stat-number">{project.candidate_count ?? 0}</span>
        <span className="stat-label"> Candidates</span>
      </div>

      <div className="project-actions">
        <button
          className="btn-upload"
          onClick={() => navigate(`/projects/${project.id}/upload`)}
        >
          Upload Resumes
        </button>
        <button
          className="btn-results"
          onClick={() => navigate(`/projects/${project.id}/results`)}
        >
          View Results
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
