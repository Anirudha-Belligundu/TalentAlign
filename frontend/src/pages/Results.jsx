import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Results.css";

const ScoreBar = ({ value, color }) => (
  <div className="score-bar-wrap">
    <div
      className="score-bar-fill"
      style={{ width: `${Math.round(value * 100)}%`, background: color }}
    />
    <span className="score-bar-pct">{Math.round(value * 100)}%</span>
  </div>
);

const Results = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState({});

  useEffect(() => {
    if (location.state?.results) {
      setData(location.state.results);
      setLoading(false);
    } else {
      api.get(`/projects/${projectId}/results`)
        .then((res) => setData(res.data))
        .finally(() => setLoading(false));
    }
  }, [projectId]);

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
    setActiveTab((prev) => ({ ...prev, [id]: prev[id] || "summary" }));
  };

  const setTab = (id, tab) => setActiveTab((prev) => ({ ...prev, [id]: tab }));

  const scoreColor = (s) =>
    s >= 0.75 ? "#16a34a" : s >= 0.50 ? "#d97706" : "#dc2626";

  return (
    <div className="results-page">
      <Navbar />
      <div className="results-content">

        {loading && (
          <div className="results-loading">
            <div className="spinner" />
            <p>Analyzing resumes, please wait...</p>
          </div>
        )}

        {data && (
          <>
            {/* Header */}
            <div className="results-header">
              <div>
                <h1>{data.title}</h1>
                <p>{data.total_candidates} candidates ranked by AI match score</p>
              </div>
              <button className="btn-back" onClick={() => navigate("/dashboard")}>
                ← Dashboard
              </button>
            </div>

            {/* JD Summary Panel */}
            {data.jd_features && (
              <div className="jd-panel">
                <h3>📋 Job Requirements Summary</h3>
                <div className="jd-grid">
                  {data.jd_features.role_summary && (
                    <div className="jd-item full">
                      <span className="jd-label">Role</span>
                      <span>{data.jd_features.role_summary}</span>
                    </div>
                  )}
                  {data.jd_features.required_experience && (
                    <div className="jd-item">
                      <span className="jd-label">Experience Required</span>
                      <span>{data.jd_features.required_experience}</span>
                    </div>
                  )}
                  {data.jd_features.required_education && (
                    <div className="jd-item">
                      <span className="jd-label">Education Required</span>
                      <span>{data.jd_features.required_education}</span>
                    </div>
                  )}
                  {data.jd_features.required_skills?.length > 0 && (
                    <div className="jd-item full">
                      <span className="jd-label">Required Skills</span>
                      <div className="tags-wrap">
                        {data.jd_features.required_skills.map((s) => (
                          <span key={s} className="tag-blue">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.jd_features.preferred_skills?.length > 0 && (
                    <div className="jd-item full">
                      <span className="jd-label">Preferred Skills</span>
                      <div className="tags-wrap">
                        {data.jd_features.preferred_skills.map((s) => (
                          <span key={s} className="tag-grey">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results Table */}
            {data.results.length === 0 ? (
              <div className="no-results">No candidates processed yet.</div>
            ) : (
              <div className="table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Candidate</th>
                      <th>Overall</th>
                      <th>Skills</th>
                      <th>Experience</th>
                      <th>Education</th>
                      <th>Matched Skills</th>
                      <th>Missing Skills</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((c, i) => (
                      <React.Fragment key={c.candidate_id}>
                        <tr className={i === 0 ? "row-top" : ""}>

                          <td className="td-rank">
                            {i === 0 ? "🏆" : `#${i + 1}`}
                          </td>

                          <td className="td-name">
                            <div className="cand-name">{c.name || c.resume_filename}</div>
                            {c.email && <div className="cand-email">{c.email}</div>}
                            {c.years_of_experience > 0 && (
                              <div className="cand-exp">
                                {c.years_of_experience} yrs exp
                              </div>
                            )}
                          </td>

                          <td className="td-overall">
                            <span style={{ color: scoreColor(c.overall_score), fontWeight: 800, fontSize: 18 }}>
                              {Math.round(c.overall_score * 100)}%
                            </span>
                          </td>

                          <td><ScoreBar value={c.skills_score} color="#2563eb" /></td>
                          <td><ScoreBar value={c.experience_score} color="#7c3aed" /></td>
                          <td><ScoreBar value={c.education_score} color="#0891b2" /></td>

                          <td className="td-tags">
                            {c.matched_skills.slice(0, 4).map((s) => (
                              <span key={s} className="tag-green">{s}</span>
                            ))}
                            {c.matched_skills.length > 4 && (
                              <span className="tag-more">+{c.matched_skills.length - 4}</span>
                            )}
                          </td>

                          <td className="td-tags">
                            {c.missing_skills.slice(0, 3).map((s) => (
                              <span key={s} className="tag-red">{s}</span>
                            ))}
                            {c.missing_skills.length > 3 && (
                              <span className="tag-more">+{c.missing_skills.length - 3}</span>
                            )}
                          </td>

                          <td>
                            <button
                              className="btn-expand"
                              onClick={() => toggleExpand(c.candidate_id)}
                            >
                              {expanded === c.candidate_id ? "▲ Hide" : "▼ View"}
                            </button>
                          </td>

                        </tr>

                        {/* Expanded Detail Panel */}
                        {expanded === c.candidate_id && (
                          <tr className="row-explanation">
                            <td colSpan={9}>
                              <div className="explanation-box">

                                {/* Tabs */}
                                <div className="detail-tabs">
                                  {["summary", "skills", "experience", "education"].map((tab) => (
                                    <button
                                      key={tab}
                                      className={`detail-tab ${activeTab[c.candidate_id] === tab ? "active" : ""}`}
                                      onClick={() => setTab(c.candidate_id, tab)}
                                    >
                                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                  ))}
                                </div>

                                {/* Summary Tab */}
                                {activeTab[c.candidate_id] === "summary" && (
                                  <div className="tab-content">
                                    <strong>AI Recruiter Summary</strong>
                                    <p>{c.explanation}</p>
                                    {c.phone && <p><strong>Phone:</strong> {c.phone}</p>}
                                    <div className="all-skills-row">
                                      <div>
                                        <strong>Matched Skills</strong>
                                        <div className="tags-wrap">
                                          {c.matched_skills.map((s) => (
                                            <span key={s} className="tag-green">{s}</span>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <strong>Missing Skills</strong>
                                        <div className="tags-wrap">
                                          {c.missing_skills.map((s) => (
                                            <span key={s} className="tag-red">{s}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Skills Tab */}
                                {activeTab[c.candidate_id] === "skills" && (
                                  <div className="tab-content">
                                    <strong>All Extracted Skills</strong>
                                    <div className="tags-wrap" style={{ marginTop: 8 }}>
                                      {c.extracted_skills?.length > 0
                                        ? c.extracted_skills.map((s) => (
                                            <span key={s} className="tag-blue">{s}</span>
                                          ))
                                        : <span className="no-data">No skills extracted</span>
                                      }
                                    </div>
                                  </div>
                                )}

                                {/* Experience Tab */}
                                {activeTab[c.candidate_id] === "experience" && (
                                  <div className="tab-content">
                                    <strong>Work History</strong>
                                    {c.work_history?.length > 0 ? (
                                      <div className="work-history">
                                        {c.work_history.map((w, idx) => (
                                          <div key={idx} className="work-item">
                                            <div className="work-role">{w.role}</div>
                                            <div className="work-company">{w.company}</div>
                                            <div className="work-duration">{w.duration}</div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="no-data">No work history found</span>
                                    )}
                                    {c.projects_list?.length > 0 && (
                                      <>
                                        <strong style={{ marginTop: 16, display: "block" }}>Projects</strong>
                                        <ul className="projects-list">
                                          {c.projects_list.map((p, idx) => (
                                            <li key={idx}>{p}</li>
                                          ))}
                                        </ul>
                                      </>
                                    )}
                                  </div>
                                )}

                                {/* Education Tab */}
                                {activeTab[c.candidate_id] === "education" && (
                                  <div className="tab-content">
                                    <strong>Education Details</strong>
                                    <div className="edu-card">
                                      <div><span className="edu-label">Degree:</span> {c.education_degree || "N/A"}</div>
                                      <div><span className="edu-label">Field:</span> {c.education_field || "N/A"}</div>
                                      <div><span className="edu-label">University:</span> {c.education_university || "N/A"}</div>
                                    </div>
                                  </div>
                                )}

                              </div>
                            </td>
                          </tr>
                        )}

                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Results;
