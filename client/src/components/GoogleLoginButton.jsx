import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleLoginButton({ role = 'Farmer', text = 'continue_with', onSuccess, onError }) {
  const btnContainerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '947153956353-nic18nr622q0vs3vie69c5g2cf2hn5uq.apps.googleusercontent.com';

  // Handle successful Google credential response
  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      const err = 'No credential received from Google';
      setErrorMsg(err);
      if (onError) onError(err);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await googleLogin(response.credential, role);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Google login error:', err);
      const message = err.response?.data?.error || 'Failed to authenticate with Google';
      setErrorMsg(message);
      if (onError) onError(message);
    } finally {
      setLoading(false);
    }
  };

  // Load GIS Script
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    // Check if script element already exists
    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      setErrorMsg('Failed to load Google Sign-In SDK. Check network or ad-blocker.');
    };
    document.body.appendChild(script);
  }, []);

  const roleRef = useRef(role);
  roleRef.current = role;

  const handleCredentialResponseRef = useRef(handleCredentialResponse);
  handleCredentialResponseRef.current = handleCredentialResponse;

  // Initialize and render Google button once script is ready
  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.id || !btnContainerRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (res) => handleCredentialResponseRef.current(res),
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear any previous button child nodes
      btnContainerRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(btnContainerRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: text,
        logo_alignment: 'left',
        width: btnContainerRef.current.offsetWidth || 340,
      });
    } catch (err) {
      console.error('Error rendering Google button:', err);
    }
  }, [scriptLoaded, clientId, text]);

  return (
    <div className="google-auth-wrapper" style={{ width: '100%', marginBottom: '1rem' }}>
      {loading ? (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #dadce0',
            borderRadius: '8px',
            color: '#3c4043',
            fontSize: '0.95rem',
            fontWeight: 500,
            gap: '10px'
          }}
        >
          <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
          <span>Signing in with Google...</span>
        </div>
      ) : (
        <div
          ref={btnContainerRef}
          style={{
            minHeight: '44px',
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
          }}
        />
      )}

      {errorMsg && (
        <p style={{ color: '#c44536', fontSize: '0.8rem', marginTop: '6px', textAlign: 'center' }}>
          ⚠️ {errorMsg}
        </p>
      )}
    </div>
  );
}
