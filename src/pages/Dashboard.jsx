import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getKnowledgeApi } from '../services/api';
import { Database, MessageSquare, LogOut, ArrowRight, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

const Dashboard = ({ setActiveTab }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    wordCount: 0,
    chunkCount: 0,
    maxWords: 10000,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getKnowledgeApi();
        if (res.data.success) {
          setStats({
            wordCount: res.data.data.wordCount || 0,
            chunkCount: res.data.data.chunkCount || 0,
            maxWords: res.data.data.maxWords || 10000,
          });
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const wordPercentage = Math.min(100, Math.round((stats.wordCount / stats.maxWords) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome Banner Card */}
      <div className="glass-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="badge badge-emerald" style={{ marginBottom: '12px' }}>
            <ShieldCheck size={14} /> Multi-User Data Isolated
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
            Welcome, {user?.name || 'User'} 👋
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px' }}>
            Manage your personal knowledge base, monitor vector processing, and chat with your isolated AI assistant.
          </p>
        </div>
      </div>

      {/* Grid Layout for Stats & Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Knowledge Overview Card */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={22} color="var(--accent-primary)" />
                Knowledge Base
              </h3>
              <span className="badge badge-purple">{stats.chunkCount} Vector Chunks</span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Storage Capacity</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>
                  {loading ? '...' : `${stats.wordCount.toLocaleString()} / ${stats.maxWords.toLocaleString()} words`}
                </strong>
              </div>

              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${wordPercentage}%`,
                    backgroundColor: wordPercentage > 90 ? '#f43f5e' : '#6366f1',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                <span>{wordPercentage}% utilized</span>
                <span>Max limit: 10,000 words</span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setActiveTab('knowledge')}
            style={{ width: '100%' }}
          >
            <BookOpen size={18} />
            Edit Knowledge Base
            <ArrowRight size={16} />
          </button>
        </div>

        {/* AI Assistant Chat Card */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={22} color="var(--accent-cyan)" />
                AI Assistant
              </h3>
              <span className="badge badge-emerald">Ready</span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Ask questions directly about your saved knowledge. Your assistant retrieves relevant vector embeddings strictly matching your identity.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setActiveTab('chat')}
            style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0284c7 100%)' }}
          >
            <Sparkles size={18} />
            Open Assistant Chat
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Account Details Card */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
              Account Information
            </h3>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>Name</span>
                <strong style={{ fontSize: '1rem' }}>{user?.name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>Email</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{user?.email}</span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-danger"
            onClick={logout}
            style={{ width: '100%' }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
