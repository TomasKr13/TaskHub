const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Endpoint pro získání zpráv týmu
router.get('/:teamId/messages', async (req, res) => {
  const { teamId } = req.params;
  try {
    const result = await query(
      `SELECT c.*, u.username 
       FROM chat c 
       JOIN users u ON c.user_id = u.user_id 
       WHERE c.team_id = $1 
       ORDER BY c.created_at ASC`,
      [teamId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Chyba při načítání zpráv:', error);
    res.status(500).json({ error: 'Chyba při načítání zpráv' });
  }
});

// Endpoint pro odeslání zprávy
router.post('/:teamId/messages', async (req, res) => {
  const { teamId } = req.params;
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'Chybí uživatelské ID nebo zpráva' });
  }

  try {
    const result = await query(
      'INSERT INTO chat (team_id, user_id, message) VALUES ($1, $2, $3) RETURNING *',
      [teamId, userId, message]
    );

    const messageWithUser = await query(
      `SELECT c.*, u.username 
       FROM chat c 
       JOIN users u ON c.user_id = u.user_id 
       WHERE c.chat_id = $1`,
      [result.rows[0].chat_id]
    );

    res.status(201).json(messageWithUser.rows[0]);
  } catch (error) {
    console.error('Chyba při odesílání zprávy:', error);
    res.status(500).json({ error: 'Chyba při odesílání zprávy' });
  }
});

// Endpoint pro smazání zprávy
router.delete('/messages/:messageId', async (req, res) => {
  const { messageId } = req.params;
  try {
    const result = await query('DELETE FROM chat WHERE chat_id = $1 RETURNING *', [messageId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Zpráva nenalezena' });
    }
    res.status(200).json({ message: 'Zpráva byla úspěšně smazána' });
  } catch (error) {
    console.error('Chyba při mazání zprávy:', error);
    res.status(500).json({ error: 'Chyba při mazání zprávy' });
  }
});

// Endpoint pro úpravu zprávy
router.put('/messages/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Chybí zpráva' });
  }

  try {
    const result = await query(
      'UPDATE chat SET message = $1 WHERE chat_id = $2 RETURNING *',
      [message, messageId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Zpráva nenalezena' });
    }

    const updatedMessage = await query(
      `SELECT c.*, u.username 
       FROM chat c 
       JOIN users u ON c.user_id = u.user_id 
       WHERE c.chat_id = $1`,
      [messageId]
    );

    res.status(200).json(updatedMessage.rows[0]);
  } catch (error) {
    console.error('Chyba při úpravě zprávy:', error);
    res.status(500).json({ error: 'Chyba při úpravě zprávy' });
  }
});

module.exports = router;