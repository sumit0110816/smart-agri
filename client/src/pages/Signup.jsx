import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import './Auth.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Farmer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <span className="auth-logo">🌾</span>
          <h1>AgriSmart</h1>
          <p className="auth-tagline">Farmer Decision Support & Logistics</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join the smartest agricultural network</p>

          {error && (
            <div className="auth-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">I am registering as a...</label>
            <div className="role-selector" style={{ display: 'flex', gap: '15px', marginTop: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="Farmer" 
                  checked={role === 'Farmer'} 
                  onChange={e => setRole(e.target.value)} 
                />
                🧑‍🌾 Farmer
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="Driver" 
                  checked={role === 'Driver'} 
                  onChange={e => setRole(e.target.value)} 
                />
                🚛 Transport Partner
              </label>
            </div>
          </div>

          {/* Google Sign Up */}
          <GoogleLoginButton 
            role={role}
            text="signup_with" 
            onError={(msg) => setError(msg)}
          />

          <div className="auth-divider">
            <span>or sign up with email</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="farmer@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              className="form-input"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? '⏳ Creating Account...' : '🌱 Create Account'}
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </form>
      </div>

      <div className="auth-hero">
        <div className="hero-content">
          <h2>Agricultural Market Intelligence</h2>
          <p>Access live market prices, coordinate logistics, and make data-driven decisions to maximize your farming profitability.</p>
          <div className="hero-features">
            <div className="hero-feature"><span>📈</span> Market Analytics</div>
            <div className="hero-feature"><span>🚛</span> Smart Logistics</div>
            <div className="hero-feature"><span>📍</span> Live Mandi Prices</div>
            <div className="hero-feature"><span>🌱</span> Knowledge Hub</div>
          </div>
        </div>
      </div>
    </div>
  );
}
