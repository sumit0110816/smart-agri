import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('agri_token');
    const savedUser = localStorage.getItem('agri_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('agri_token', newToken);
    localStorage.setItem('agri_user', JSON.stringify(userData));
    return res.data;
  };

  const signup = async (name, email, password, role) => {
    const res = await authAPI.signup(name, email, password, role);
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('agri_token', newToken);
    localStorage.setItem('agri_user', JSON.stringify(userData));
    return res.data;
  };

  const googleLogin = async (credential, role) => {
    const res = await authAPI.googleLogin(credential, role);
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('agri_token', newToken);
    localStorage.setItem('agri_user', JSON.stringify(userData));
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('agri_token');
    localStorage.removeItem('agri_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, googleLogin, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
