import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tripsAPI } from '../utils/api';
import './TransportRequest.css';

const CROP_OPTIONS = [
  '🌾 Wheat', '🍚 Rice', '🌽 Maize', '🫘 Soybean', '🧅 Onion',
  '🍅 Tomato', '🥔 Potato', '🌶️ Chilli', '🌿 Turmeric', '☕ Coffee',
  '🥜 Groundnut', '🫘 Gram', '🌻 Sunflower', '🍉 Watermelon',
];

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: '#3b7ea1', bg: 'rgba(59,126,161,0.1)',  icon: '🕐' },
  accepted:   { label: 'Accepted',   color: '#c9a84c', bg: 'rgba(201,168,76,0.1)', icon: '✅' },
  'in-transit': { label: 'In Transit', color: '#6b5b95', bg: 'rgba(107,91,149,0.1)', icon: '🚛' },
  completed:  { label: 'Completed',  color: '#4a7a2e', bg: 'rgba(74,122,46,0.1)',  icon: '🎉' },
  cancelled:  { label: 'Cancelled',  color: '#888',    bg: 'rgba(150,150,150,0.1)', icon: '✕' },
};

export default function TransportRequest() {
  const { user } = useAuth();

  // Tab: 'post' | 'my-requests'
  const [tab, setTab] = useState('post');

  // Form state
  const [form, setForm] = useState({
    crop: '', weight: '', weightUnit: 'quintal',
    pickup: '', destination: '', preferredDate: '', payment: '', notes: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // My requests state
  const [myTrips, setMyTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsError, setTripsError] = useState('');

  const fetchMyTrips = async () => {
    setTripsLoading(true);
    setTripsError('');
    try {
      const res = await tripsAPI.mine();
      setMyTrips(res.data.trips || []);
    } catch (err) {
      setTripsError(err.response?.data?.error || 'Failed to load your trips.');
    } finally {
      setTripsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'my-requests') fetchMyTrips();
  }, [tab]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      await tripsAPI.create(form);
      setFormSuccess('🎉 Transport request posted! Drivers in your area will see it shortly.');
      setForm({ crop: '', weight: '', weightUnit: 'quintal', pickup: '', destination: '', preferredDate: '', payment: '', notes: '' });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to post request. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trip request?')) return;
    try {
      await tripsAPI.delete(id);
      setMyTrips(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete.');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this trip? The driver will be notified.')) return;
    try {
      await tripsAPI.updateStatus(id, 'cancelled');
      setMyTrips(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel.');
    }
  };

  return (
    <div className="page-container tr-page">
      {/* Header */}
      <div className="tr-header">
        <div className="tr-header-left">
          <span className="tr-header-icon">🚛</span>
          <div>
            <h1 className="tr-title">Transport Requests</h1>
            <p className="tr-subtitle">Hire a driver to transport your produce to the market</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tr-tabs">
        <button className={`tr-tab ${tab === 'post' ? 'tr-tab-active' : ''}`} onClick={() => setTab('post')}>
          📋 Post New Request
        </button>
        <button
          className={`tr-tab ${tab === 'my-requests' ? 'tr-tab-active' : ''}`}
          onClick={() => setTab('my-requests')}
        >
          📦 My Requests
          {myTrips.length > 0 && <span className="tr-badge">{myTrips.length}</span>}
        </button>
      </div>

      {/* Post Tab */}
      {tab === 'post' && (
        <div className="tr-form-container">
          <div className="tr-form-card">
            <div className="tr-form-card-header">
              <h2>New Transport Request</h2>
              <p>Fill in the details below. Available drivers will see your request and can accept it.</p>
            </div>

            {formError && (
              <div className="tr-alert tr-alert-error">⚠️ {formError}</div>
            )}
            {formSuccess && (
              <div className="tr-alert tr-alert-success">{formSuccess}</div>
            )}

            <form className="tr-form" onSubmit={handleSubmit}>
              {/* Crop */}
              <div className="tr-form-row">
                <div className="tr-form-group">
                  <label className="tr-label">Crop / Produce *</label>
                  <select
                    name="crop"
                    className="tr-input"
                    value={form.crop}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select crop...</option>
                    {CROP_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Weight */}
                <div className="tr-form-group">
                  <label className="tr-label">Quantity *</label>
                  <div className="tr-input-group">
                    <input
                      name="weight"
                      type="number"
                      min="1"
                      className="tr-input"
                      placeholder="e.g. 30"
                      value={form.weight}
                      onChange={handleChange}
                      required
                    />
                    <select
                      name="weightUnit"
                      className="tr-input tr-select-unit"
                      value={form.weightUnit}
                      onChange={handleChange}
                    >
                      <option value="quintal">Quintal</option>
                      <option value="kg">Kg</option>
                      <option value="ton">Ton</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pickup */}
              <div className="tr-form-group">
                <label className="tr-label">Pickup Location *</label>
                <input
                  name="pickup"
                  type="text"
                  className="tr-input"
                  placeholder="Your farm address / village, district"
                  value={form.pickup}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Destination */}
              <div className="tr-form-group">
                <label className="tr-label">Destination / Mandi *</label>
                <input
                  name="destination"
                  type="text"
                  className="tr-input"
                  placeholder="e.g. APMC Hubli, Dharwad Market"
                  value={form.destination}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Date & Payment */}
              <div className="tr-form-row">
                <div className="tr-form-group">
                  <label className="tr-label">Preferred Pickup Date</label>
                  <input
                    name="preferredDate"
                    type="date"
                    className="tr-input"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.preferredDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="tr-form-group">
                  <label className="tr-label">Offered Payment (₹) *</label>
                  <input
                    name="payment"
                    type="number"
                    min="1"
                    className="tr-input"
                    placeholder="e.g. 2500"
                    value={form.payment}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="tr-form-group">
                <label className="tr-label">Additional Notes</label>
                <textarea
                  name="notes"
                  className="tr-input tr-textarea"
                  placeholder="Any special instructions — fragile produce, road access, timing preferences, etc."
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <button type="submit" className="tr-submit-btn" disabled={formLoading}>
                {formLoading ? '⏳ Posting...' : '🚛 Post Transport Request'}
              </button>
            </form>
          </div>

          {/* How it works */}
          <div className="tr-how-it-works">
            <h3>How it works</h3>
            <div className="tr-steps">
              <div className="tr-step">
                <div className="tr-step-num">1</div>
                <div>
                  <strong>Post your request</strong>
                  <p>Enter your crop details, pickup location, destination and payment offer.</p>
                </div>
              </div>
              <div className="tr-step">
                <div className="tr-step-num">2</div>
                <div>
                  <strong>Driver accepts</strong>
                  <p>A registered transport partner in your area reviews and accepts your request.</p>
                </div>
              </div>
              <div className="tr-step">
                <div className="tr-step-num">3</div>
                <div>
                  <strong>Track your shipment</strong>
                  <p>Monitor the trip status in real time from "My Requests".</p>
                </div>
              </div>
              <div className="tr-step">
                <div className="tr-step-num">4</div>
                <div>
                  <strong>Delivery confirmed</strong>
                  <p>Once delivered, the driver marks it complete and you pay the agreed amount.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Requests Tab */}
      {tab === 'my-requests' && (
        <div className="tr-my-requests">
          <div className="tr-my-header">
            <h2>Your Transport Requests</h2>
            <button className="tr-refresh-btn" onClick={fetchMyTrips} disabled={tripsLoading}>
              {tripsLoading ? '⏳' : '🔄'} Refresh
            </button>
          </div>

          {tripsLoading && (
            <div className="tr-loading">
              <div className="spinner" />
              <p>Loading your trips...</p>
            </div>
          )}

          {tripsError && <div className="tr-alert tr-alert-error">⚠️ {tripsError}</div>}

          {!tripsLoading && myTrips.length === 0 && (
            <div className="tr-empty">
              <span>🚛</span>
              <p>No transport requests yet.</p>
              <p className="tr-empty-sub">Post your first request using the "Post New Request" tab above.</p>
              <button className="tr-submit-btn" style={{ maxWidth: 220 }} onClick={() => setTab('post')}>
                + Post a Request
              </button>
            </div>
          )}

          <div className="tr-trips-list">
            {myTrips.map(trip => {
              const st = STATUS_CONFIG[trip.status] || STATUS_CONFIG.pending;
              return (
                <div key={trip.id} className="tr-trip-card">
                  <div className="tr-trip-top">
                    <div className="tr-trip-crop">{trip.crop}</div>
                    <span className="tr-status-pill" style={{ background: st.bg, color: st.color }}>
                      {st.icon} {st.label}
                    </span>
                  </div>

                  <div className="tr-trip-route">
                    <div className="tr-route-row">
                      <span className="tr-route-dot tr-dot-green" />
                      <div>
                        <span className="tr-route-lbl">Pickup</span>
                        <span className="tr-route-val">{trip.pickup}</span>
                      </div>
                    </div>
                    <div className="tr-route-connector" />
                    <div className="tr-route-row">
                      <span className="tr-route-dot tr-dot-red" />
                      <div>
                        <span className="tr-route-lbl">Destination</span>
                        <span className="tr-route-val">{trip.destination}</span>
                      </div>
                    </div>
                  </div>

                  <div className="tr-trip-chips">
                    <span className="tr-chip">⚖️ {trip.weight} {trip.weightUnit}</span>
                    <span className="tr-chip tr-chip-green">💵 ₹{trip.payment}</span>
                    {trip.preferredDate && <span className="tr-chip">📅 {trip.preferredDate}</span>}
                  </div>

                  {/* Driver info */}
                  {trip.driverName && (
                    <div className="tr-driver-info">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span>Driver: <strong>{trip.driverName}</strong></span>
                      {trip.acceptedAt && (
                        <span className="tr-accepted-time">
                          Accepted {new Date(trip.acceptedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                  )}

                  {trip.notes && (
                    <div className="tr-notes">📝 {trip.notes}</div>
                  )}

                  {/* Actions */}
                  <div className="tr-trip-actions">
                    <span className="tr-posted-at">
                      Posted {new Date(trip.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {trip.status === 'pending' && (
                        <button className="tr-btn-danger" onClick={() => handleDelete(trip.id)}>
                          🗑️ Delete
                        </button>
                      )}
                      {(trip.status === 'pending' || trip.status === 'accepted') && (
                        <button className="tr-btn-cancel" onClick={() => handleCancel(trip.id)}>
                          ✕ Cancel
                        </button>
                      )}
                      {trip.status === 'completed' && (
                        <span className="tr-completed-badge">✅ Delivery Complete</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
