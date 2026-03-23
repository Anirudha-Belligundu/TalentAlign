import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Upload.css";

const Upload = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [jdFile, setJdFile] = useState(null);
  const [resumesZip, setResumesZip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!jdFile) { setError("Please select a Job Description PDF."); return; }
    if (!resumesZip) { setError("Please select a resumes ZIP file."); return; }
    if (!jdFile.name.toLowerCase().endsWith(".pdf")) { setError("JD must be a PDF file."); return; }
    if (!resumesZip.name.toLowerCase().endsWith(".zip")) { setError("Resumes must be a ZIP file."); return; }

    setError("");
    setLoading(true);
    setProgress("Uploading files...");

    // Section 12.3 — multipart/form-data upload
    const formData = new FormData();
    formData.append("jd_file", jdFile);         // must match backend param name
    formData.append("resumes_zip", resumesZip); // must match backend param name

    try {
      setProgress("AI is reading and scoring all resumes. This may take a moment...");

      // Demo mode — skip real API call
      if (localStorage.getItem("access_token") === "demo-token") {
        await new Promise((r) => setTimeout(r, 2000)); // simulate processing
        navigate(`/projects/${projectId}/results`);
        return;
      }

      const response = await api.post(
        `/projects/${projectId}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      navigate(`/projects/${projectId}/results`, {
        state: { results: response.data },
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <div className="upload-page">
      <Navbar />
      <div className="upload-content">
        <div className="upload-card">

          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>

          <h1>Upload Files</h1>
          <p>
            Upload the Job Description PDF and a ZIP of all candidate resumes.
            AI will automatically score and rank every candidate.
          </p>

          {error && <div className="upload-error">{error}</div>}

          {loading ? (
            <div className="upload-loading">
              <div className="spinner"></div>
              <p>{progress}</p>
              <span>Do not close this page.</span>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="upload-form">

              {/* JD PDF Upload */}
              <div className={`upload-zone ${jdFile ? "upload-zone--selected" : ""}`}>
                <div className="upload-zone-icon">📄</div>
                <h3>Job Description</h3>
                <p>PDF file only</p>
                <label className="file-label">
                  {jdFile ? `✅  ${jdFile.name}` : "Choose PDF file"}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setJdFile(e.target.files[0])}
                    hidden
                  />
                </label>
              </div>

              {/* Resume ZIP Upload */}
              <div className={`upload-zone ${resumesZip ? "upload-zone--selected" : ""}`}>
                <div className="upload-zone-icon">🗂️</div>
                <h3>Candidate Resumes</h3>
                <p>ZIP file containing all PDF resumes</p>
                <label className="file-label">
                  {resumesZip ? `✅  ${resumesZip.name}` : "Choose ZIP file"}
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setResumesZip(e.target.files[0])}
                    hidden
                  />
                </label>
              </div>

              <div className="upload-tip">
                💡 ZIP should contain only PDF resume files. Non-PDF files are
                skipped automatically.
              </div>

              <button
                type="submit"
                className="btn-process"
                disabled={!jdFile || !resumesZip}
              >
                Process with AI →
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
