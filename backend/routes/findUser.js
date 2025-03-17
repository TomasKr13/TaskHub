const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Endpoint pro vyhledání uživatele podle jména
router.get('/searchUser/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const result = await query('SELECT user_id, username FROM users WHERE username ILIKE $1', [`%${username}%`]);
    res.json(result.rows);
  } catch (error) {
    console.error('Chyba při vyhledávání uživatelů:', error);
    res.status(500).json({ error: 'Chyba při vyhledávání uživatelů' });
  }
});

module.exports = router;
