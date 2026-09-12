import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { weatherAPI, tripsAPI } from '../utils/api';
import NotificationPanel from '../components/NotificationPanel';
import './DriverDashboard.css';

const EARNINGS = {
  today: 6500,
  week: 28400,
  month: 89200,
  trips_completed: 142,
  rating: 4.8,
  on_time: '96%',
};

const MARKETS_NEARBY = [
  { name: 'APMC Hubli', distance: '12 km', active: true, crops: 'Wheat, Onion, Tomato' },
  { name: 'Dharwad Mandi', distance: '24 km', active: true, crops: 'Maize, Soybean' },
  { name: 'Gadag APMC', distance: '41 km', active: false, crops: 'Groundnut, Chilli' },
];

const STATUS_CONFIG = {
  accepted:     { label: 'Accepted',    color: '#c9a84c', bg: 'rgba(201,168,76,0.1)',  icon: '✅' },
  'in-transit': { label: 'In Transit',  color: '#6b5b95', bg: 'rgba(107,91,149,0.1)', icon: '🚛' },
  completed:    { label: 'Completed',   color: '#4a7a2e', bg: 'rgba(74,122,46,0.1)',  icon: '🎉' },
  cancelled:    { label: 'Cancelled',   color: '#888',    bg: 'rgba(150,150,150,0.1)', icon: '✕' },
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [availableTrips, setAvailableTrips] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsError, setTripsError] = useState('');

  const [notifOpen, setNotifOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [tab, setTab] = useState('requests');
  const [toast, setToast] = useState(null);

  // Live weather
  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true);
      let lat = 15.36, lng = 75.12;
      try {
        if (navigator.geolocation) {
          const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      } catch (_) { /* defaults */ }
      try {
        const res = await weatherAPI.getCurrent(lat, lng);
        setWeather(res.data);
      } catch (_) {
        setWeather({
          current: { temperature: 29, humidity: 58, windSpeed: 14, description: 'Clear Sky', emoji: '☀️' },
          nextPrecipitation: { hours: 8, probability: 20 },
        });
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, []);

  // Fetch trips from API
  const fetchTrips = useCallback(async () => {
    setTripsLoading(true);
    setTripsError('');
    try {
      const [availRes, mineRes] = await Promise.all([
        tripsAPI.available(),
        tripsAPI.mine(),
      ]);
      setAvailableTrips(availRes.data.trips || []);
      setMyTrips((mineRes.data.trips || []).filter(t => t.status !== 'pending'));
    } catch (err) {
      setTripsError(err.response?.data?.error || 'Failed to load trips. Please refresh.');
    } finally {
      setTripsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAccept = async (tripId) => {
    try {
      await tripsAPI.accept(tripId);
      showToast('🎉 Trip accepted! Head to the pickup location. The farmer has been notified.');
      fetchTrips();
      setTab('active');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to accept trip.', 'error');
    }
  };

  const handleUpdateStatus = async (tripId, newStatus) => {
    try {
      await tripsAPI.updateStatus(tripId, newStatus);
      const label = newStatus === 'in-transit' ? 'In Transit' : 'Completed';
      showToast(`✅ Trip marked as ${label}.`);
      fetchTrips();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update status.', 'error');
    }
  };

  const activeTrips = myTrips.filter(t => t.status === 'accepted' || t.status === 'in-transit');
  const completedTrips = myTrips.filter(t => t.status === 'completed');

  const w = weather?.current || {};

  return (
    <div className="page-container driver-dashboard">
      {/* TOP BAR */}
      <div className="dd-topbar">
        <div className="dd-topbar-left">
          <span className="dd-truck-icon">🚛</span>
          <div>
            <h1 className="dd-title">Transport Dashboard</h1>
            <p className="dd-subtitle">Welcome back, {user?.name?.split(' ')[0] || 'Driver'}</p>
          </div>
        </div>
        <div className="dd-topbar-right">
          <div className="dd-status-toggle">
            <span className="dd-status-dot" />
            <span className="dd-status-label">Available</span>
          </div>
          <button className="dd-icon-btn" title="Refresh trips" onClick={fetchTrips}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button className="dd-icon-btn" onClick={() => setNotifOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="dd-stats-row">
        <div className="dd-stat-card dd-stat-blue">
          <span className="dd-stat-icon">📋</span>
          <div>
            <div className="dd-stat-value">{tripsLoading ? '...' : availableTrips.length}</div>
            <div className="dd-stat-label">Available Jobs</div>
          </div>
        </div>
        <div className="dd-stat-card dd-stat-amber">
          <span className="dd-stat-icon">🚚</span>
          <div>
            <div className="dd-stat-value">{tripsLoading ? '...' : activeTrips.length}</div>
            <div className="dd-stat-label">Active Trips</div>
          </div>
        </div>
        <div className="dd-stat-card dd-stat-green">
          <span className="dd-stat-icon">✅</span>
          <div>
            <div className="dd-stat-value">{tripsLoading ? '...' : completedTrips.length}</div>
            <div className="dd-stat-label">Completed</div>
          </div>
        </div>
        <div className="dd-stat-card dd-stat-purple">
          <span className="dd-stat-icon">⭐</span>
          <div>
            <div className="dd-stat-value">{EARNINGS.rating}/5</div>
            <div className="dd-stat-label">Driver Rating</div>
          </div>
        </div>
        <div className="dd-stat-card dd-stat-teal">
          <span className="dd-stat-icon">🕐</span>
          <div>
            <div className="dd-stat-value">{EARNINGS.on_time}</div>
            <div className="dd-stat-label">On-Time Rate</div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="dd-grid">
        {/* LEFT */}
        <div className="dd-left">
          <div className="dd-tabs">
            <button className={`dd-tab ${tab === 'requests' ? 'dd-tab-active' : ''}`} onClick={() => setTab('requests')}>
              📋 Available Jobs
              {availableTrips.length > 0 && <span className="dd-badge">{availableTrips.length}</span>}
            </button>
            <button className={`dd-tab ${tab === 'active' ? 'dd-tab-active' : ''}`} onClick={() => setTab('active')}>
              🚛 My Active Trips
              {activeTrips.length > 0 && <span className="dd-badge dd-badge-amber">{activeTrips.length}</span>}
            </button>
            <button className={`dd-tab ${tab === 'history' ? 'dd-tab-active' : ''}`} onClick={() => setTab('history')}>
              📦 History
            </button>
          </div>

          {/* Error */}
          {tripsError && (
            <div className="dd-error-banner">
              ⚠️ {tripsError}
              <button onClick={fetchTrips}>Retry</button>
            </div>
          )}

          {/* Available Jobs */}
          {tab === 'requests' && (
            <div className="dd-card-list">
              {tripsLoading && (
                <div className="dd-loading-state">
                  <div className="spinner" style={{ margin: '0 auto' }} />
                  <p>Loading available trips from farmers...</p>
                </div>
              )}

              {!tripsLoading && availableTrips.length === 0 && (
                <div className="dd-empty">
                  <span style={{ fontSize: '3rem' }}>🔍</span>
                  <p>No available trips right now.</p>
                  <p className="dd-empty-sub">When farmers post transport requests, they'll appear here. Check back soon!</p>
                </div>
              )}

              {availableTrips.map(trip => (
                <div key={trip.id} className="dd-trip-card">
                  <div className="dd-trip-header">
                    <div className="dd-trip-crop">{trip.crop}</div>
                    <span className="dd-status-pill pending">🆕 New from Farmer</span>
                  </div>

                  {/* Farmer info */}
                  <div className="dd-trip-farmer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>Posted by <strong>{trip.farmerName}</strong></span>
                  </div>

                  {/* Route */}
                  <div className="dd-trip-route">
                    <div className="dd-route-point">
                      <span className="dd-route-dot pickup" />
                      <div>
                        <span className="dd-route-label">Pickup</span>
                        <span className="dd-route-place">{trip.pickup}</span>
                      </div>
                    </div>
                    <div className="dd-route-line" />
                    <div className="dd-route-point">
                      <span className="dd-route-dot drop" />
                      <div>
                        <span className="dd-route-label">Destination</span>
                        <span className="dd-route-place">{trip.destination}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dd-trip-meta">
                    <span className="dd-meta-chip">⚖️ {trip.weight} {trip.weightUnit}</span>
                    <span className="dd-meta-chip dd-payment">💵 ₹{trip.payment}</span>
                    {trip.preferredDate && <span className="dd-meta-chip">📅 {trip.preferredDate}</span>}
                  </div>

                  {trip.notes && (
                    <div className="dd-trip-notes">📝 {trip.notes}</div>
                  )}

                  <div className="dd-trip-actions">
                    <button className="dd-btn-accept" onClick={() => handleAccept(trip.id)}>
                      ✅ Accept This Trip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Trips */}
          {tab === 'active' && (
            <div className="dd-card-list">
              {tripsLoading && (
                <div className="dd-loading-state">
                  <div className="spinner" style={{ margin: '0 auto' }} />
                  <p>Loading your trips...</p>
                </div>
              )}

              {!tripsLoading && activeTrips.length === 0 && (
                <div className="dd-empty">
                  <span style={{ fontSize: '3rem' }}>🚛</span>
                  <p>No active trips.</p>
                  <p className="dd-empty-sub">Accept an available job to get started!</p>
                </div>
              )}

              {activeTrips.map(trip => {
                const st = STATUS_CONFIG[trip.status];
                return (
                  <div key={trip.id} className="dd-trip-card dd-active-card">
                    <div className="dd-trip-header">
                      <div className="dd-trip-crop">{trip.crop}</div>
                      <span className="dd-status-pill" style={{ background: st?.bg, color: st?.color }}>
                        {st?.icon} {st?.label}
                      </span>
                    </div>

                    <div className="dd-trip-farmer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span>Farmer: <strong>{trip.farmerName}</strong></span>
                    </div>

                    <div className="dd-trip-route">
                      <div className="dd-route-point">
                        <span className="dd-route-dot pickup" />
                        <div>
                          <span className="dd-route-label">Pickup from</span>
                          <span className="dd-route-place">{trip.pickup}</span>
                        </div>
                      </div>
                      <div className="dd-route-line" />
                      <div className="dd-route-point">
                        <span className="dd-route-dot drop" />
                        <div>
                          <span className="dd-route-label">Deliver to</span>
                          <span className="dd-route-place">{trip.destination}</span>
                        </div>
                      </div>
                    </div>

                    <div className="dd-trip-meta">
                      <span className="dd-meta-chip">⚖️ {trip.weight} {trip.weightUnit}</span>
                      <span className="dd-meta-chip dd-payment">💵 ₹{trip.payment}</span>
                    </div>

                    {trip.notes && <div className="dd-trip-notes">📝 {trip.notes}</div>}

                    <div className="dd-active-actions">
                      {trip.status === 'accepted' && (
                        <button className="dd-btn-transit" onClick={() => handleUpdateStatus(trip.id, 'in-transit')}>
                          🚛 Start Trip (Mark In Transit)
                        </button>
                      )}
                      {trip.status === 'in-transit' && (
                        <button className="dd-btn-complete" onClick={() => handleUpdateStatus(trip.id, 'completed')}>
                          ✅ Mark as Delivered
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* History */}
          {tab === 'history' && (
            <div className="dd-card-list">
              {!tripsLoading && completedTrips.length === 0 && (
                <div className="dd-empty">
                  <span style={{ fontSize: '3rem' }}>📦</span>
                  <p>No completed trips yet.</p>
                  <p className="dd-empty-sub">Your delivery history will appear here.</p>
                </div>
              )}

              {completedTrips.map(trip => (
                <div key={trip.id} className="dd-trip-card" style={{ opacity: 0.85 }}>
                  <div className="dd-trip-header">
                    <div className="dd-trip-crop">{trip.crop}</div>
                    <span className="dd-status-pill" style={{ background: 'rgba(74,122,46,0.1)', color: '#4a7a2e' }}>
                      🎉 Delivered
                    </span>
                  </div>
                  <div className="dd-trip-farmer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>{trip.farmerName}</span>
                  </div>
                  <div className="dd-trip-meta">
                    <span className="dd-meta-chip">📍 {trip.pickup} → {trip.destination}</span>
                    <span className="dd-meta-chip">⚖️ {trip.weight} {trip.weightUnit}</span>
                    <span className="dd-meta-chip dd-payment">💵 ₹{trip.payment}</span>
                  </div>
                  {trip.completedAt && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Completed: {new Date(trip.completedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="dd-right">
          {/* Weather */}
          <div className="dd-weather-card">
            <div className="dd-weather-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d5016" strokeWidth="2">
                <path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><circle cx="12" cy="12" r="4"/>
              </svg>
              <span className="dd-weather-label">Route Weather</span>
              {!weatherLoading && <span className="dd-live-badge">🟢 LIVE</span>}
            </div>
            {weatherLoading ? (
              <div className="dd-weather-loading"><div className="spinner" style={{ margin: '0 auto' }} /><p>Fetching weather...</p></div>
            ) : (
              <>
                <div className="dd-weather-body">
                  <span className="dd-weather-emoji">{w.emoji || '☀️'}</span>
                  <div>
                    <div className="dd-weather-temp">{w.temperature || 29}°C</div>
                    <div className="dd-weather-desc">{w.description || 'Clear Sky'}</div>
                  </div>
                </div>
                <div className="dd-weather-stats">
                  <div className="dd-weather-stat"><span>💧 Humidity</span><strong>{w.humidity || 58}%</strong></div>
                  <div className="dd-weather-stat"><span>💨 Wind</span><strong>{w.windSpeed || 14} km/h</strong></div>
                </div>
                {weather?.nextPrecipitation && (
                  <div className="dd-weather-alert">
                    🌧️ Rain in {weather.nextPrecipitation.hours}h ({weather.nextPrecipitation.probability}% chance)
                  </div>
                )}
              </>
            )}
          </div>

          {/* Nearby Markets */}
          <div className="dd-markets-card">
            <div className="dd-markets-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d5016" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="dd-markets-title">Nearby Mandis</span>
            </div>
            <div className="dd-markets-list">
              {MARKETS_NEARBY.map((m, i) => (
                <div key={i} className={`dd-market-item ${!m.active ? 'dd-market-closed' : ''}`}>
                  <div className="dd-market-dot" style={{ background: m.active ? '#4a7a2e' : '#aaa' }} />
                  <div className="dd-market-info">
                    <span className="dd-market-name">{m.name}</span>
                    <span className="dd-market-crops">{m.crops}</span>
                  </div>
                  <div className="dd-market-right">
                    <span className="dd-market-distance">{m.distance}</span>
                    <span className={`dd-market-status ${m.active ? 'open' : 'closed'}`}>{m.active ? 'Open' : 'Closed'}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="dd-find-more-btn" onClick={() => navigate('/market-locator')}>
              🗺️ Find More Markets
            </button>
          </div>

          {/* Tips */}
          <div className="dd-tips-card">
            <div className="dd-tips-header">💡 Driver Tips</div>
            <ul className="dd-tips-list">
              <li>📦 Check crop weight limit before accepting — your vehicle max load applies.</li>
              <li>🌧️ Bad weather? Inform the farmer before starting the trip.</li>
              <li>📍 Always confirm pickup address via call before leaving.</li>
              <li>⭐ On-time deliveries improve your rating and attract more job offers.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`dd-toast ${toast.type === 'error' ? 'dd-toast-error' : 'dd-toast-success'}`}>
          {toast.msg}
        </div>
      )}

      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
