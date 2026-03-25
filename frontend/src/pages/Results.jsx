import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Results.css";

const ScoreBar = ({ value, color }) => (
  <div className="score-bar-wrap">
    <div className="score-bar-fill" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
    <span className="score-bar-pct">{Math.round(value * 100)}%</span>
  </div>
);

const STATUS_OPTIONS = [
  { value: "new",         label: "New",         color: "#64748b", bg: "#f1f5f9" },
  { value: "shortlisted", label: "✅ Shortlisted", color: "#15803d", bg: "#dcfce7" },
  { value: "on_hold",     label: "⏸ On Hold",    color: "#d97706", bg: "#fef3c7" },
  { value: "rejected",    label: "❌ Rejected",   color: "#dc2626", bg: "#fee2e2" },
];

const Results = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [notes, setNotes] = useState({});
  const [savingNote, setSavingNote] = useState({});
  const [candidateStatuses, setCandidateStatuses] = useState({});

  useEffect(() => {
    if (location.state?.results) {
      initData(location.state.results);
      setLoading(false);
    } else {
      api.get(`/projects/${projectId}/results`)
        .then((res) => initData(res.data))
        .finally(() => setLoading(false));
    }
  }, [projectId]);

  const initData = (d) => {
    setData(d);
    const initialNotes = {};
    const initialStatuses = {};
    (d.results || []).forEach((c) => {
      initialNotes[c.candidate_id] = c.recruiter_note || "";
      initialStatuses[c.candidate_id] = c.status || "new";
    });
    setNotes(initialNotes);
    setCandidateStatuses(initialStatuses);
  };

  const toggleExpand = (id) => setExpanded(expanded === id ? null : id);
  const setTab = (id, tab) => setActiveTab((prev) => ({ ...prev, [id]: tab }));
  const getTab = (id) => activeTab[id] || "summary";
  const scoreColor = (s) => s >= 0.75 ? "#16a34a" : s >= 0.50 ? "#d97706" : "#dc2626";

  const saveNote = async (candidateId) => {
    setSavingNote((prev) => ({ ...prev, [candidateId]: true }));
    try {
      await api.patch(`/projects/${projectId}/candidates/${candidateId}`, {
        recruiter_note: notes[candidateId],
      });
    } finally {
      setSavingNote((prev) => ({ ...prev, [candidateId]: false }));
    }
  };

  const updateStatus = async (candidateId, status) => {
    setCandidateStatuses((prev) => ({ ...prev, [candidateId]: status }));
    await api.patch(`/projects/${projectId}/candidates/${candidateId}`, { status });
  };

  const getStatusStyle = (status) => {
    const s = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
    return { color: s.color, background: s.bg };
  };

  return (
    <div className="results-page">
      <Navbar />
      <div className="results-content">

        {loading && (
          <div className="results-loading">
            <div className="spinner" />
            <p>Loading results...</p>
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
              <button className="btn-back" onClick={() => navigate("/dashboard")}>← Dashboard</button>
            </div>

            {/* JD Panel */}
            {data.jd_structure && (
              <div className="jd-panel">
                <h3>📋 Job Requirements</h3>
                <div className="jd-grid">
                  <div className="jd-item">
                    <span className="jd-label">Experience</span>
                    <span className="jd-value">
                      {data.jd_structure.required_experience_years > 0
                        ? `${data.jd_structure.required_experience_years}+ years`
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="jd-item">
                    <span className="jd-label">Education</span>
                    <span className="jd-value">{data.jd_structure.required_education || "Not specified"}</span>
                  </div>
                  <div className="jd-item jd-item-full">
                    <span className="jd-label">Required Skills</span>
                    <div className="tags-wrap">
                      {(data.jd_structure.required_skills || []).map((s) => (
                        <span key={s} className="tag-blue">{s}</span>
                      ))}
                    </div>
                  </div>
                  {(data.jd_structure.nice_to_have_skills || []).length > 0 && (
                    <div className="jd-item jd-item-full">
                      <span className="jd-label">Nice to Have</span>
                      <div className="tags-wrap">
                        {data.jd_structure.nice_to_have_skills.map((s) => (
                          <span key={s} className="tag-gray">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                      <th>Matched</th>
                      <th>Missing</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((c, i) => (
                      <React.Fragment key={c.candidate_id}>
                        <tr className={i === 0 ? "row-top" : ""}>

                          <td className="td-rank">{i === 0 ? "🏆" : `#${i + 1}`}</td>

                          <td className="td-name">
                            <div className="cand-name">{c.name || c.resume_filename}</div>
                            {c.email && <div className="cand-email">{c.email}</div>}
                            {c.phone && <div className="cand-email">{c.phone}</div>}
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
                            {c.matched_skills.slice(0, 3).map((s) => (
                              <span key={s} className="tag-green">{s}</span>
                            ))}
                            {c.matched_skills.length > 3 && (
                              <span className="tag-more">+{c.matched_skills.length - 3}</span>
                            )}
                          </td>

                          <td className="td-tags">
                            {c.missing_skills.slice(0, 2).map((s) => (
                              <span key={s} className="tag-red">{s}</span>
                            ))}
                            {c.missing_skills.length > 2 && (
                              <span className="tag-more">+{c.missing_skills.length - 2}</span>
                            )}
                          </td>

                          {/* Status Dropdown */}
                          <td>
                            <select
                              className="status-select"
                              value={candidateStatuses[c.candidate_id] || "new"}
                              onChange={(e) => updateStatus(c.candidate_id, e.target.value)}
                              style={getStatusStyle(candidateStatuses[c.candidate_id])}
                            >
                              {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>

                          <td>
                            <button className="btn-expand" onClick={() => toggleExpand(c.candidate_id)}>
                              {expanded === c.candidate_id ? "▲ Hide" : "▼ View"}
                            </button>
                          </td>

                        </tr>

                        {/* Expanded Row */}
                        {expanded === c.candidate_id && (
                          <tr className="row-explanation">
                            <td colSpan={10}>
                              <div className="explanation-box">

                                {/* Tabs */}
                                <div className="detail-tabs">
                                  {["summary", "skills", "experience", "education", "projects", "notes"].map((tab) => (
                                    <button
                                      key={tab}
                                      className={`detail-tab ${getTab(c.candidate_id) === tab ? "active" : ""}`}
                                      onClick={() => setTab(c.candidate_id, tab)}
                                    >
                                      {tab === "notes" ? "📝 Notes" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                  ))}
                                </div>

                                {/* Summary */}
                                {getTab(c.candidate_id) === "summary" && (
                                  <div className="tab-content">
                                    <strong>AI Recruiter Summary</strong>
                                    <p>{c.explanation}</p>
                                  </div>
                                )}

                                {/* Skills */}
                                {getTab(c.candidate_id) === "skills" && (
                                  <div className="tab-content">
                                    <div className="all-skills-row">
                                      <div>
                                        <strong>All Extracted Skills</strong>
                                        <div className="tags-wrap">
                                          {(c.extracted_skills || []).map((s) => (
                                            <span key={s} className="tag-blue">{s}</span>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <strong>✅ Matched</strong>
                                        <div className="tags-wrap">
                                          {c.matched_skills.map((s) => (
                                            <span key={s} className="tag-green">{s}</span>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <strong>❌ Missing</strong>
                                        <div className="tags-wrap">
                                          {c.missing_skills.map((s) => (
                                            <span key={s} className="tag-red">{s}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Experience */}
                                {getTab(c.candidate_id) === "experience" && (
                                  <div className="tab-content">
                                    <strong>Total Experience: {c.experience_years || 0} years</strong>
                                    <div className="work-history">
                                      {(c.work_history || []).length === 0 ? (
                                        <p>No work history extracted.</p>
                                      ) : (
                                        c.work_history.map((w, idx) => (
                                          <div key={idx} className="work-item">
                                            <div className="work-role">{w.role}</div>
                                            <div className="work-company">{w.company} · {w.duration}</div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Education */}
                                {getTab(c.candidate_id) === "education" && (
                                  <div className="tab-content">
                                    <div className="edu-block">
                                      <div className="edu-degree">
                                        {c.education_degree || "Degree not found"}
                                        {c.education_field ? ` in ${c.education_field}` : ""}
                                      </div>
                                      <div className="edu-university">{c.education_university || ""}</div>
                                    </div>
                                  </div>
                                )}

                                {/* Projects */}
                                {getTab(c.candidate_id) === "projects" && (
                                  <div className="tab-content">
                                    {(c.projects_list || []).length === 0 ? (
                                      <p>No projects extracted.</p>
                                    ) : (
                                      <ul className="projects-list">
                                        {c.projects_list.map((p, idx) => (
                                          <li key={idx}>{p}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}

                                {/* Notes */}
                                {getTab(c.candidate_id) === "notes" && (
                                  <div className="tab-content">
                                    <strong>Recruiter Notes</strong>
                                    <p className="notes-hint">Private notes visible only to you — "Called, interested", "Salary too high", etc.</p>
                                    <textarea
                                      className="notes-textarea"
                                      placeholder="Add your notes about this candidate..."
                                      value={notes[c.candidate_id] || ""}
                                      onChange={(e) => setNotes((prev) => ({ ...prev, [c.candidate_id]: e.target.value }))}
                                      rows={4}
                                    />
                                    <button
                                      className="btn-save-note"
                                      onClick={() => saveNote(c.candidate_id)}
                                      disabled={savingNote[c.candidate_id]}
                                    >
                                      {savingNote[c.candidate_id] ? "Saving..." : "💾 Save Note"}
                                    </button>
                                    {notes[c.candidate_id] && (
                                      <div className="note-preview">
                                        <span>📝</span> {notes[c.candidate_id]}
                                      </div>
                                    )}
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