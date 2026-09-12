import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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
          <p className="auth-tagline">AI-Powered Farming Intelligence</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to access your dashboard</p>

          {error && (
            <div className="auth-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In */}
          <GoogleLoginButton 
            text="signin_with" 
            onError={(msg) => setError(msg)}
          />

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="farmer@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? '⏳ Signing in...' : '🔓 Sign In'}
          </button>

          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </form>
      </div>

      <div className="auth-hero">
        <div className="hero-content">
          <h2>Intelligent Farming Made Easy</h2>
          <p>A comprehensive platform for monitoring weather, soil health, crop analytics, and discovering new market opportunities using advanced AI models.</p>
          <div className="hero-features">
            <div className="hero-feature"><span>📈</span> Price Prediction</div>
            <div className="hero-feature"><span>📊</span> Demand Forecast</div>
            <div className="hero-feature"><span>📍</span> Market Locator</div>
            <div className="hero-feature"><span>🌱</span> Crop Advisor</div>
          </div>
        </div>
      </div>
    </div>
  );
}
