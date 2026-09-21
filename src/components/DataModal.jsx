import React, { useState, useEffect } from 'react';
import { saveKnowledgeApi, getKnowledgeApi } from '../services/api';
import { X, Save, FileText, AlertCircle, CheckCircle, Database } from 'lucide-react';

const MAX_WORDS = 10000;

const countWords = (str) => {
  if (!str || typeof str !== 'string') return 0;
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};

const DataModal = ({ isOpen, onClose, email, onSaveSuccess }) => {
  const [textData, setTextData] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const wordCount = countWords(textData);
  const percentage = Math.min(100, Math.round((wordCount / MAX_WORDS) * 100));
  const isOverLimit = wordCount > MAX_WORDS;

  useEffect(() => {
    if (isOpen) {
      // Load existing knowledge if available
      const fetchExisting = async () => {
        try {
          const res = await getKnowledgeApi();
          if (res.data.success && res.data.data.rawText) {
            setTextData(res.data.data.rawText);
          }
        } catch (err) {
          console.error('Failed to load existing data for modal:', err);
        }
      };
      fetchExisting();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (isOverLimit) {
      setStatusMsg({
        type: 'error',
        text: `Word limit exceeded! Reduce text by ${wordCount - MAX_WORDS} words before saving.`,
      });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await saveKnowledgeApi(textData);
      if (res.data.success) {
        setStatusMsg({
          type: 'success',
          text: `Data saved successfully!`,
        });
        setTimeout(() => {
          onSaveSuccess && onSaveSuccess(res.data.data, wordCount, textData);
          onClose();
        }, 800);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save text data.';
      setStatusMsg({
        type: 'error',
        text: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '650px',
          padding: '28px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          border: '1px solid var(--border-glass-focus)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={22} color="var(--accent-cyan)" />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Add Knowledge Data</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>
                Account: Private & Encrypted Workspace
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {statusMsg && (
          <div className={`alert ${statusMsg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {statusMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Text area */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Paste or enter personal text data below (Max 10,000 words):
          </label>
          <textarea
            className="textarea-field"
            rows={8}
            placeholder="Enter personal background, skills, projects, notes... (e.g. My name is Amna. I work as a Software Engineer. I specialize in React and Node.js. I built an AI Assistant application.)"
            value={textData}
            onChange={(e) => setTextData(e.target.value)}
            style={{
              borderColor: isOverLimit ? 'rgba(244, 63, 94, 0.6)' : undefined,
              fontSize: '0.95rem',
            }}
          />
        </div>

        {/* Word count progress bar */}
        <div style={{ marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600, color: isOverLimit ? '#fca5a5' : 'var(--text-main)' }}>
              Word Count: {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
            </span>
            <span style={{ color: isOverLimit ? '#fca5a5' : 'var(--text-muted)' }}>
              {percentage}% used
            </span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{
                width: `${percentage}%`,
                backgroundColor: isOverLimit ? '#f43f5e' : percentage > 85 ? '#f59e0b' : '#6366f1',
              }}
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading || !textData.trim() || isOverLimit}
          >
            <Save size={16} />
            {loading ? 'Processing Embeddings...' : 'Save Data & Enable Chat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataModal;
