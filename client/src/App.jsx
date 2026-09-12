import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import VoiceAssistant from './components/VoiceAssistant';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import DriverDashboard from './pages/DriverDashboard';
import PricePrediction from './pages/PricePrediction';
import DemandForecast from './pages/DemandForecast';
import MarketLocator from './pages/MarketLocator';
import CropRecommendation from './pages/CropRecommendation';
import StorageAdvice from './pages/StorageAdvice';
import NewsPage from './pages/NewsPage';
import YojanaPage from './pages/YojanaPage';
import TransportRequest from './pages/TransportRequest';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Loading AgriSmart...</p>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <VoiceAssistant />
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const isDriver = user?.role === 'Driver';
  const homeRoute = isDriver ? '/driver-dashboard' : '/dashboard';

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={homeRoute} replace /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={homeRoute} replace /> : <Signup />} />

      {/* Farmer Dashboard */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Driver Dashboard */}
      <Route path="/driver-dashboard" element={
        <ProtectedRoute>
          <AppLayout><DriverDashboard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/price-prediction" element={
        <ProtectedRoute>
          <AppLayout><PricePrediction /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/demand-forecast" element={
        <ProtectedRoute>
          <AppLayout><DemandForecast /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/market-locator" element={
        <ProtectedRoute>
          <AppLayout><MarketLocator /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/crop-recommendation" element={
        <ProtectedRoute>
          <AppLayout><CropRecommendation /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/storage-advice" element={
        <ProtectedRoute>
          <AppLayout><StorageAdvice /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/news" element={
        <ProtectedRoute>
          <AppLayout><NewsPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/yojana" element={
        <ProtectedRoute>
          <AppLayout><YojanaPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/transport" element={
        <ProtectedRoute>
          <AppLayout><TransportRequest /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to={isAuthenticated ? homeRoute : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
