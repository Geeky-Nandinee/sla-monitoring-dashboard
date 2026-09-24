import React, { useState, useRef } from 'react';
import { uploadCsv } from '../services/api';

export default function UploadSection({ onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successSummary, setSuccessSummary] = useState(null);

  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Please select a valid CSV file (.csv).');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessSummary(null);

    try {
      const res = await uploadCsv(file);
      setSuccessSummary(res.data);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during CSV file upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="card">
      <div className="upload-container">
        <div
          className={`dropzone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="file-input"
            accept=".csv"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <svg className="dropzone-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="dropzone-text">
            {isUploading ? 'Uploading & Processing CSV Data...' : 'Click or Drag & Drop Health Check CSV File Here'}
          </div>
          <div className="dropzone-subtext">
            Supports multi-day monitoring check CSV logs (e.g. 9d, 12d, 14d, 21d, 30d)
          </div>
        </div>

        {isUploading && (
          <div className="upload-progress">
            <div className="spinner"></div>
            <span>Cleaning, validating, and persisting records to MySQL...</span>
          </div>
        )}

        {successSummary && (
          <div className="alert alert-success">
            <div>
              <strong>Upload Completed Successfully!</strong> [{successSummary.filename}]
              <div style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                Total: {successSummary.summary.total_rows} rows | Valid: {successSummary.summary.valid_rows} | Invalid: {successSummary.summary.invalid_rows} | Deduplicated: {successSummary.summary.duplicate_rows}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => setSuccessSummary(null)}>Dismiss</button>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-error">
            <div>
              <strong>Upload Failed:</strong> {errorMsg}
            </div>
            <button className="btn btn-secondary" onClick={() => setErrorMsg(null)}>Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}
