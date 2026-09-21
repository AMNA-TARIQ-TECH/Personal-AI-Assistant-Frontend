import React from 'react';
import { User, Bot } from 'lucide-react';

const Message = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isUser
            ? 'linear-gradient(135deg, var(--accent-cyan) 0%, #0284c7 100%)'
            : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-purple) 100%)',
          boxShadow: isUser
            ? '0 0 10px rgba(6, 182, 212, 0.3)'
            : '0 0 10px rgba(99, 102, 241, 0.3)',
        }}
      >
        {isUser ? <User size={18} color="#fff" /> : <Bot size={18} color="#fff" />}
      </div>

      {/* Message Bubble Container */}
      <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px', paddingLeft: '4px', paddingRight: '4px' }}>
          {isUser ? 'You' : 'Personal AI Assistant'}
        </div>

        <div
          style={{
            background: isUser ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isUser ? 'rgba(6, 182, 212, 0.3)' : 'var(--border-glass)'}`,
            borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
            padding: '14px 18px',
            color: 'var(--text-main)',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
};

export default Message;
