import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendOtpApi, verifyOtpApi } from '../services/api';
import {
  Bot, User, Mail, Lock, UserPlus, AlertCircle,
  CheckCircle, ShieldCheck, RefreshCw, ArrowRight
} from 'lucide-react';

// Client-side real email validation
const EMAIL_REGEX = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
  'guerrillamail.com', 'yopmail.com', 'trashmail.com', 'fakeinbox.com',
  'dispostable.com', 'getnada.com', 'example.com', 'test.com', 'fake.com', 'dummy.com',
];

// STEP 1: Registration form → STEP 2: OTP entry → STEP 3: Complete
const STEP_REGISTER = 'register';
const STEP_OTP = 'otp';
const STEP_DONE = 'done';

const Register = ({ onSwitchToLogin }) => {
  const { register } = useAuth();

  // Step state
  const [step, setStep] = useState(STEP_REGISTER);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP input (6 individual digit boxes)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // UI state
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ─── Step 1: Validate & send OTP ──────────────────────────────────────────
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const domain = cleanEmail.split('@')[1];

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('Please enter a valid real email address (e.g. name@gmail.com).');
      return;
    }

    if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
      setError('Temporary or disposable email addresses are not allowed.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtpApi(cleanEmail);
      if (res.data.success) {
        setStep(STEP_OTP);
        setSuccessMsg(`A 6-digit OTP has been sent to ${cleanEmail}. Check your inbox.`);
        startResendCooldown();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP digit input handling ──────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);
    // Auto-advance to next box
    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = [...otpDigits];
    pasted.split('').forEach((ch, i) => { updated[i] = ch; });
    setOtpDigits(updated);
    otpRefs[Math.min(pasted.length, 5)].current?.focus();
  };

  // ─── Step 2: Verify OTP then register ─────────────────────────────────────
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const otp = otpDigits.join('');

    if (otp.length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      // First verify OTP
      const verifyRes = await verifyOtpApi(email.trim().toLowerCase(), otp);
      if (!verifyRes.data.success) {
        setError(verifyRes.data.message || 'OTP verification failed.');
        setLoading(false);
        return;
      }

      // OTP verified — now register the account
      const result = await register(name.trim(), email.trim(), password);
      if (result.success) {
        setStep(STEP_DONE);
      } else {
        setError(result.message || 'Registration failed after OTP verification.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ────────────────────────────────────────────────────────────
  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setSuccessMsg(null);
    setResendLoading(true);
    try {
      const res = await sendOtpApi(email.trim().toLowerCase());
      if (res.data.success) {
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessMsg('A new OTP has been sent to your email.');
        startResendCooldown();
        otpRefs[0].current?.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  // ─── Shared header ─────────────────────────────────────────────────────────
  const Header = ({ title, subtitle }) => (
    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
      <div
        style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-primary) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px auto', boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)',
        }}
      >
        <Bot size={32} color="#fff" />
      </div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>{subtitle}</p>
    </div>
  );

  // ─── STEP 1: Register Form ─────────────────────────────────────────────────
  if (step === STEP_REGISTER) {
    return (
      <div style={{ maxWidth: '440px', margin: '50px auto 0 auto', padding: '0 16px' }}>
        <div className="glass-card" style={{ padding: '36px' }}>
          <Header title="Create Account" subtitle="Build your personal RAG knowledge assistant today" />

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Amna Tariq"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="input-field"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  className="input-field"
                  placeholder="•••••••• (Min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            >
              {loading ? (
                <>Sending OTP...</>
              ) : (
                <><ArrowRight size={18} /> Continue with Email Verification</>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer' }}
            >
              Sign In Here
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 2: OTP Verification ──────────────────────────────────────────────
  if (step === STEP_OTP) {
    return (
      <div style={{ maxWidth: '440px', margin: '50px auto 0 auto', padding: '0 16px' }}>
        <div className="glass-card" style={{ padding: '36px' }}>
          <Header title="Verify Your Email" subtitle={`Enter the 6-digit OTP sent to ${email}`} />

          {successMsg && (
            <div className="alert alert-success" style={{ marginBottom: '16px' }}>
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleOtpSubmit}>
            {/* 6-digit OTP input boxes */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '28px' }}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  style={{
                    width: '52px', height: '60px',
                    textAlign: 'center', fontSize: '1.6rem', fontWeight: 700,
                    background: 'rgba(255,255,255,0.05)',
                    border: `2px solid ${digit ? 'var(--accent-cyan)' : 'var(--border-glass)'}`,
                    borderRadius: '10px', color: 'var(--text-main)',
                    outline: 'none', caretColor: 'var(--accent-cyan)',
                    transition: 'border-color 0.2s',
                  }}
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || otpDigits.join('').length < 6}
              style={{ width: '100%', padding: '12px', marginBottom: '16px' }}
            >
              {loading ? 'Verifying & Creating Account...' : (
                <><ShieldCheck size={18} /> Verify OTP & Create Account</>
              )}
            </button>
          </form>

          {/* Resend OTP */}
          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Didn't receive the code?{' '}
            <button
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || resendLoading}
              style={{
                background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent-cyan)',
                fontWeight: 600, fontSize: '0.9rem',
              }}
            >
              {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : (
                <><RefreshCw size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Resend OTP</>
              )}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button
              onClick={() => { setStep(STEP_REGISTER); setError(null); setSuccessMsg(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ← Back to Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 3: Success ───────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '440px', margin: '50px auto 0 auto', padding: '0 16px' }}>
      <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '2px solid rgba(16, 185, 129, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px auto',
        }}>
          <CheckCircle size={40} color="#10b981" />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>Account Created! 🎉</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Your email has been verified and your account is ready. Welcome to your Personal AI Assistant!
        </p>
        <button
          className="btn btn-primary"
          onClick={onSwitchToLogin}
          style={{ width: '100%', padding: '12px' }}
        >
          <UserPlus size={18} /> Sign In to Your Account
        </button>
      </div>
    </div>
  );
};

export default Register;
