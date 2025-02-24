const express = require('express');
const crypto = require('crypto');
const db = require('../db'); 

const router = express.Router();

// Funkce pro hashování hesla
const hashPassword = (password, salt) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex')); 
    });
  });

// Registrace uživatele
router.post('/register', async (req, res) => {
  const { username, age, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
      // Kontrola, zda e-mail již není zaregistrován
    const emailCheck = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = crypto.randomBytes(16).toString('hex');

        // Hashování hesla
    const hashedPassword = await hashPassword(password, salt);

    // Uložení uživatele do databáze
    const result = await db.query(
      'INSERT INTO Users (username, age, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING user_id',
      [username, age, email, `${salt}:${hashedPassword}`]
    );
    // Vrácení ID nově vytvořeného uživatele
    const userId = result.rows[0].user_id;
    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Přihlášení uživatele
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
      // Vyhledání uživatele podle e-mailu
    const userResult = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    const [salt, storedHash] = user.password_hash.split(':');

    const hashedPassword = await hashPassword(password, salt);

    if (hashedPassword !== storedHash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

      // Uložení uživatele do session
    req.session.user = { id: user.user_id, username: user.username, email: user.email };
    console.log(req.session.user);
    res.json({ message: 'Login successful', user: req.session.user });
  } catch (error) {
    console.error(error);
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Odhlášení uživatele
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); 
    res.json({ message: 'Logout successful' });
  });
});


// API route
router.get("/info", (req, res) => {
  if (req.session.user) {
    res.json({
      isLoggedIn: true,
      user: req.session.user,
    });
  } else {
    res.status(401).json({
      isLoggedIn: false,
      error: "Uživatel není přihlášen",
    });
  }
});

module.exports = router;
