const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'agri_smart_secret_key_2024_hackathon';

// Helper: read users from file
function getUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper: save users to file
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required (name, email, password, role)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const users = getUsers();
    const existingUser = users.find(u => u.email === email.toLowerCase());

    if (existingUser) {
      if (!existingUser.password) {
        // User previously registered with Google: attach password so they can log in both ways!
        existingUser.password = await bcrypt.hash(password, 10);
        if (name) existingUser.name = name.trim();
        if (role) existingUser.role = role;
        saveUsers(users);

        const token = jwt.sign(
          { id: existingUser.id, name: existingUser.name, email: existingUser.email, role: existingUser.role, picture: existingUser.picture },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.status(200).json({
          message: 'Password linked to your Google account! You can now sign in with either Google or email/password.',
          token,
          user: { id: existingUser.id, name: existingUser.name, email: existingUser.email, role: existingUser.role, picture: existingUser.picture }
        });
      }
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = getUsers();
    const user = users.find(u => u.email === email.toLowerCase().trim());

    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please sign up first.' });
    }

    // If user registered with Google and has no local password
    if (!user.password) {
      return res.status(400).json({ 
        error: 'This account was registered using Google. Please click "Sign in with Google" above, or create a password on the Sign Up page.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, picture: user.picture },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, picture: user.picture }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

/**
 * POST /api/auth/google
 * Authenticate or register with Google OAuth ID token
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    let googleUser = null;

    // 1. Verify token with Google's official tokeninfo endpoint
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (response.ok) {
        const payload = await response.json();
        const expectedClientId = process.env.GOOGLE_CLIENT_ID;

        // Security check 1: Enforce audience match to prevent cross-client token replay
        if (expectedClientId && payload.aud !== expectedClientId) {
          console.error(`[Google Auth Security] Audience mismatch: expected ${expectedClientId}, got ${payload.aud}`);
          return res.status(401).json({ error: 'Unauthorized: Google token was not issued for this application.' });
        }

        // Security check 2: Verify the email is verified by Google
        const isVerified = payload.email_verified === 'true' || payload.email_verified === true;
        if (!isVerified) {
          return res.status(401).json({ error: 'Google email address is not verified.' });
        }

        googleUser = {
          sub: payload.sub,
          email: payload.email,
          name: payload.name || payload.given_name || 'Google User',
          picture: payload.picture || null,
          email_verified: true
        };
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[Google Auth] Tokeninfo verification failed:', errData);
      }
    } catch (fetchErr) {
      console.error('[Google Auth] Tokeninfo network error:', fetchErr);
    }

    // Reject any token that failed cryptographic verification
    if (!googleUser || !googleUser.email) {
      return res.status(401).json({ error: 'Invalid or expired Google authentication token.' });
    }

    const users = getUsers();
    let user = users.find(u => u.email === googleUser.email.toLowerCase().trim());

    if (user) {
      // User exists: update Google info if missing
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        updated = true;
      }
      if (googleUser.picture && !user.picture) {
        user.picture = googleUser.picture;
        updated = true;
      }
      if (updated) {
        saveUsers(users);
      }
    } else {
      // Create new user
      user = {
        id: uuidv4(),
        name: googleUser.name,
        email: googleUser.email.toLowerCase().trim(),
        role: role || 'Farmer',
        googleId: googleUser.sub,
        picture: googleUser.picture,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        picture: user.picture 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Google login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Failed to authenticate with Google. Please try again.' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (protected)
 */
router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
