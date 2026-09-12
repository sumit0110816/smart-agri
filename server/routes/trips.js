const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');

const TRIPS_FILE = path.join(__dirname, '..', 'data', 'trips.json');

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTrips() {
  try {
    const data = fs.readFileSync(TRIPS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveTrips(trips) {
  fs.writeFileSync(TRIPS_FILE, JSON.stringify(trips, null, 2));
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/trips
 * Farmer creates a new transport request
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    const { role, id: farmerId, name: farmerName } = req.user;

    console.log(`[Trips] POST / — user role: "${role}", id: ${farmerId}, name: ${farmerName}`);

    if (!role || role.toLowerCase() !== 'farmer') {
      return res.status(403).json({ error: `Only Farmers can post trip requests. Your role is: "${role || 'undefined'}". Please log out and sign in as a Farmer.` });
    }

    const { crop, weight, weightUnit, pickup, destination, preferredDate, payment, notes } = req.body;

    if (!crop || !weight || !pickup || !destination || !payment) {
      return res.status(400).json({ error: 'crop, weight, pickup, destination and payment are required.' });
    }

    const trip = {
      id: crypto.randomUUID(),
      farmerId,
      farmerName,
      driverId: null,
      driverName: null,
      crop: crop.trim(),
      weight: String(weight),
      weightUnit: weightUnit || 'quintal',
      pickup: pickup.trim(),
      destination: destination.trim(),
      preferredDate: preferredDate || null,
      payment: String(payment),
      notes: notes ? notes.trim() : '',
      status: 'pending',   // pending | accepted | in-transit | completed | cancelled
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      completedAt: null,
    };

    const trips = getTrips();
    trips.push(trip);
    saveTrips(trips);

    res.status(201).json({ message: 'Trip request posted successfully!', trip });
  } catch (err) {
    console.error('Create trip error:', err);
    res.status(500).json({ error: 'Failed to post trip request.' });
  }
});

/**
 * GET /api/trips/available
 * Driver fetches all pending trip requests
 */
router.get('/available', authMiddleware, (req, res) => {
  try {
    const trips = getTrips().filter(t => t.status === 'pending');
    res.json({ trips });
  } catch (err) {
    console.error('Get available trips error:', err);
    res.status(500).json({ error: 'Failed to fetch available trips.' });
  }
});

/**
 * GET /api/trips/mine
 * Returns trips for the current user (farmer sees own requests, driver sees accepted/active trips)
 */
router.get('/mine', authMiddleware, (req, res) => {
  try {
    const { id, role } = req.user;
    const trips = getTrips();

    let myTrips;
    if (role === 'Farmer') {
      myTrips = trips.filter(t => t.farmerId === id);
    } else {
      myTrips = trips.filter(t => t.driverId === id);
    }

    // Sort newest first
    myTrips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ trips: myTrips });
  } catch (err) {
    console.error('Get my trips error:', err);
    res.status(500).json({ error: 'Failed to fetch your trips.' });
  }
});

/**
 * PUT /api/trips/:id/accept
 * Driver accepts a pending trip
 */
router.put('/:id/accept', authMiddleware, (req, res) => {
  try {
    const { role, id: driverId, name: driverName } = req.user;

    if (role !== 'Driver') {
      return res.status(403).json({ error: 'Only Drivers can accept trips.' });
    }

    const trips = getTrips();
    const trip = trips.find(t => t.id === req.params.id);

    if (!trip) return res.status(404).json({ error: 'Trip not found.' });
    if (trip.status !== 'pending') {
      return res.status(409).json({ error: `Trip is already ${trip.status}.` });
    }

    trip.driverId = driverId;
    trip.driverName = driverName;
    trip.status = 'accepted';
    trip.acceptedAt = new Date().toISOString();

    saveTrips(trips);
    res.json({ message: 'Trip accepted! Head to pickup location.', trip });
  } catch (err) {
    console.error('Accept trip error:', err);
    res.status(500).json({ error: 'Failed to accept trip.' });
  }
});

/**
 * PUT /api/trips/:id/status
 * Update trip status (in-transit, completed, cancelled)
 */
router.put('/:id/status', authMiddleware, (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { status } = req.body;

    const VALID_TRANSITIONS = {
      Driver: { accepted: 'in-transit', 'in-transit': 'completed' },
      Farmer: { pending: 'cancelled', accepted: 'cancelled' },
    };

    if (!VALID_TRANSITIONS[role]) {
      return res.status(403).json({ error: 'Permission denied.' });
    }

    const trips = getTrips();
    const trip = trips.find(t => t.id === req.params.id);

    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    // Ownership check
    if (role === 'Driver' && trip.driverId !== userId) {
      return res.status(403).json({ error: 'This is not your trip.' });
    }
    if (role === 'Farmer' && trip.farmerId !== userId) {
      return res.status(403).json({ error: 'This is not your trip.' });
    }

    const allowed = VALID_TRANSITIONS[role][trip.status];
    if (allowed !== status) {
      return res.status(400).json({ error: `Cannot transition from "${trip.status}" to "${status}".` });
    }

    trip.status = status;
    if (status === 'completed') trip.completedAt = new Date().toISOString();

    saveTrips(trips);
    res.json({ message: `Trip marked as ${status}.`, trip });
  } catch (err) {
    console.error('Update trip status error:', err);
    res.status(500).json({ error: 'Failed to update trip status.' });
  }
});

/**
 * DELETE /api/trips/:id
 * Farmer deletes a pending trip request
 */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const trips = getTrips();
    const idx = trips.findIndex(t => t.id === req.params.id);

    if (idx === -1) return res.status(404).json({ error: 'Trip not found.' });

    const trip = trips[idx];
    if (trip.farmerId !== userId || role !== 'Farmer') {
      return res.status(403).json({ error: 'Only the farmer who posted this trip can delete it.' });
    }
    if (trip.status !== 'pending') {
      return res.status(409).json({ error: 'Only pending trips can be deleted.' });
    }

    trips.splice(idx, 1);
    saveTrips(trips);
    res.json({ message: 'Trip request deleted.' });
  } catch (err) {
    console.error('Delete trip error:', err);
    res.status(500).json({ error: 'Failed to delete trip.' });
  }
});

module.exports = router;
