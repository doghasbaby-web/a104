import express from 'express';
import { registerUser, loginUser } from '../utils/auth';

const router = express.Router();

// Register new user
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await registerUser(email, password, fullName);

    res.status(201).json({
      user: result.user,
      session: {
        access_token: result.token,
        user: result.user
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await loginUser(email, password);

    res.json({
      user: result.user,
      session: {
        access_token: result.token,
        user: result.user
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

export default router;
