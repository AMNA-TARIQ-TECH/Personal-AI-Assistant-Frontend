import React, { useState, useEffect } from 'react';
import { getKnowledgeApi, saveKnowledgeApi, deleteKnowledgeApi } from '../services/api';
import { Save, Trash2, RefreshCw, AlertCircle, CheckCircle, Database } from 'lucide-react';

const MAX_WORDS = 10000;

const countWords = (str) => {
  if (!str || typeof str !== 'string') return 0;
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};

const KnowledgeEditor = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success'|'error', text: '' }
  const [chunkCount, setChunkCount] = useState(0);

  const wordCount = countWords(text);
  const percentage = Math.min(100, Math.round((wordCount / MAX_WORDS) * 100));
  const isOverLimit = wordCount > MAX_WORDS;

  const fetchKnowledge = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await getKnowledgeApi();
      if (res.data.success) {
        setText(res.data.data.rawText || '');
        setChunkCount(res.data.data.chunkCount || 0);
      }
    } catch (err) {
      console.error('Failed to load knowledge:', err);
      setStatusMsg({
        type: 'error',
        text: 'Failed to load existing knowledge from server.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleSave = async () => {
    if (isOverLimit) {
      setStatusMsg({
        type: 'error',
        text: `Word limit exceeded! Please reduce knowledge by ${wordCount - MAX_WORDS} words before saving.`,
      });
      return;
    }

    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await saveKnowledgeApi(text);
      if (res.data.success) {
        setStatusMsg({
          type: 'success',
          text: `Knowledge saved successfully! Processed into ${res.data.data.chunkCount} searchable vector chunks.`,
        });
        setChunkCount(res.data.data.chunkCount);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to process knowledge.';
      setStatusMsg({
        type: 'error',
        text: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to delete all your stored knowledge chunks? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await deleteKnowledgeApi();
      if (res.data.success) {
        setText('');
        setChunkCount(0);
        setStatusMsg({
          type: 'success',
          text: 'All personal knowledge deleted.',
        });
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: 'Failed to delete knowledge.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={24} color="var(--accent-primary)" />
            My Personal Knowledge
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Enter your background, notes, resume, or custom info. Your assistant will answer questions strictly based on this.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-purple">
            {chunkCount} Chunks Indexed
          </span>
        </div>
      </div>

      {statusMsg && (
        <div className={`alert ${statusMsg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {statusMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your stored knowledge...
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <textarea
              className="textarea-field"
              rows={12}
              placeholder="Paste or type your personal information here... (e.g. My name is Alex. I work as a Lead Frontend Engineer at Tech Corp. I am proficient in React, Node.js, and Python. I love playing tennis in my free time.)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                borderColor: isOverLimit ? 'rgba(244, 63, 94, 0.6)' : undefined,
                fontSize: '0.95rem',
                lineHeight: '1.6',
              }}
            />
          </div>

          {/* Word Count Progress Bar */}
          <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 600, color: isOverLimit ? '#fca5a5' : 'var(--text-main)' }}>
                Word Count: {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
              </span>
              <span style={{ fontSize: '0.85rem', color: isOverLimit ? '#fca5a5' : 'var(--text-muted)' }}>
                {percentage}% used
              </span>
            </div>

            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: isOverLimit
                    ? '#f43f5e'
                    : percentage > 85
                    ? '#f59e0b'
                    : '#6366f1',
                }}
              />
            </div>

            {isOverLimit && (
              <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginTop: '8px', fontWeight: 600 }}>
                ⚠️ Warning: Max word limit exceeded by {(wordCount - MAX_WORDS).toLocaleString()} words!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={fetchKnowledge}
              disabled={saving}
            >
              <RefreshCw size={16} />
              Reset
            </button>
            <button
              className="btn btn-danger"
              onClick={handleClear}
              disabled={saving || !text}
            >
              <Trash2 size={16} />
              Clear Knowledge
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || isOverLimit}
            >
              <Save size={16} />
              {saving ? 'Processing Vector Chunks...' : 'Save & Process Knowledge'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default KnowledgeEditor;
