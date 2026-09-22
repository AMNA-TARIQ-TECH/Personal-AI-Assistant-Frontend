import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import DataModal from './DataModal';
import { sendChatMessageApi, getKnowledgeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, Trash2, Bot, AlertCircle, Loader2 } from 'lucide-react';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

const ChatWindow = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Welcome! Enter your Gmail in the chat box below to add your text data, or ask any question!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [chunkCount, setChunkCount] = useState(0);

  // Pop-up modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detectedEmail, setDetectedEmail] = useState('');

  const messagesEndRef = useRef(null);

  // Check existing knowledge on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getKnowledgeApi();
        if (res.data.success && res.data.data.chunkCount > 0) {
          setChunkCount(res.data.data.chunkCount);
        }
      } catch (err) {
        console.error('Error fetching knowledge stats:', err);
      }
    };
    fetchStats();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle Chat Input submission
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setErrorMsg(null);

    // Check if input contains an email address
    const emailMatch = userText.match(EMAIL_REGEX);

    if (emailMatch) {
      const enteredEmail = emailMatch[0].toLowerCase().trim();
      const currentUserEmail = user?.email ? user.email.toLowerCase().trim() : '';

      const isAuthorized = currentUserEmail
        ? enteredEmail === currentUserEmail
        : enteredEmail === 'amnaatariq005@gmail.com';

      if (isAuthorized) {
        setDetectedEmail(enteredEmail);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'user',
            text: '[Gmail Verified]',
          },
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: `Gmail verified. Opening pop-up modal to add your text data...`,
          },
        ]);
        setIsModalOpen(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'user',
            text: userText,
          },
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: `Access Denied: Only your registered email can open the data modal.`,
          },
        ]);
      }
      return;
    }

    // Standard Question answering
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: userText,
      },
    ]);
    setLoading(true);

    try {
      const res = await sendChatMessageApi(userText);
      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: res.data.answer,
            sources: res.data.sources || [],
          },
        ]);
      } else {
        setErrorMsg(res.data.message || 'Unable to generate response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const msg = err.response?.data?.message || 'Unable to generate answer right now.';
      setErrorMsg(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: 'Sorry, I could not find your stored text data. Please enter your Gmail to add your data first.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSuccess = (data, wordCount, rawText) => {
    setChunkCount(data.chunkCount || 1);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'assistant',
        text: `✅ Data saved and vector-indexed successfully! Ask a question now!`,
      },
    ]);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'assistant',
        text: 'Chat history cleared. Enter your Gmail to add data or ask a question.',
      },
    ]);
    setErrorMsg(null);
  };

  return (
    <>
      {/* Pop-Up Modal for Adding Data */}
      <DataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        email={detectedEmail}
        onSaveSuccess={handleSaveSuccess}
      />

      <div className="glass-card" style={{ height: '720px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header Bar - Clean title and clear chat action */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot size={22} color="var(--accent-primary)" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>AI Chat Assistant</h3>
              <span style={{ fontSize: '0.75rem', color: chunkCount > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
              </span>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleClearChat}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            title="Clear Chat History"
          >
            <Trash2 size={14} />
            Clear Chat
          </button>
        </div>

        {/* Message Window */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
          }}
        >
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', paddingLeft: '48px' }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Searching vector database & synthesizing answer...</span>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar - Placeholder shows "Ask a question..." */}
        <form
          onSubmit={handleSend}
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-glass)',
            background: 'rgba(0,0,0,0.25)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            className="input-field"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{ flex: 1 }}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !input.trim()}
            style={{ padding: '12px 20px' }}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            <span>Send</span>
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatWindow;
