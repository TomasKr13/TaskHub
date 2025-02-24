const express = require('express');
const router = express.Router();
const { query } = require('../db');

// *****************************
// POST /api/teams - Vytvoření týmu
// *****************************
router.post('/', async (req, res) => {
  const { teamName } = req.body;
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Nejste přihlášeni.' });
  }
  if (!teamName) {
    return res.status(400).json({ error: 'Musíte zadat název týmu.' });
  }

  try {
    const existingTeam = await query(
      'SELECT 1 FROM team WHERE team_name = $1',
      [teamName]
    );
    if (existingTeam.rowCount > 0) {
      return res.status(400).json({ error: 'Tým s tímto názvem již existuje.' });
    }

    const teamResult = await query(
      'INSERT INTO team (team_name) VALUES ($1) RETURNING team_id',
      [teamName]
    );

    if (!teamResult.rows.length) {
      throw new Error('Tým nebyl vytvořen.');
    }

    const teamId = teamResult.rows[0].team_id;

    await query(
      'INSERT INTO team_members (user_id, team_id, role) VALUES ($1, $2, $3)',
      [userId, teamId, 'owner']
    );

    res.status(201).json({ message: 'Tým byl úspěšně vytvořen', teamId });
  } catch (error) {
    console.error('❌ Chyba při vytváření týmu:', error);
    res.status(500).json({ error: 'Nepodařilo se vytvořit tým' });
  }
});

// *****************************
// GET /api/teams - Načtení týmů uživatele
// *****************************
router.get('/', async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Nejste přihlášeni.' });
  }

  try {
    const result = await query(
      `SELECT t.team_id, t.team_name
       FROM team t
       JOIN team_members tm ON t.team_id = tm.team_id
       WHERE tm.user_id = $1`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ Chyba při načítání týmů:', error);
    res.status(500).json({ error: 'Chyba při načítání týmů' });
  }
});

// *****************************
// GET /api/teams/:teamId/members - Načtení členů týmu
// *****************************
router.get('/:teamId/members', async (req, res) => {
  const { teamId } = req.params;
  try {
    const result = await query(
      `SELECT u.user_id, u.username, tm.role 
       FROM team_members tm 
       JOIN users u ON tm.user_id = u.user_id
       WHERE tm.team_id = $1`,
      [teamId]
    );
    res.status(200).json({ members: result.rows });
  } catch (error) {
    console.error('❌ Chyba při načítání členů týmu:', error);
    res.status(500).json({ error: 'Chyba při načítání členů týmu' });
  }
});

// *****************************
// DELETE /api/teams/:teamId - Smazání týmu
// *****************************
router.delete('/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Nejste přihlášeni.' });
  }

  try {
    const teamOwner = await query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = $3',
      [teamId, userId, 'owner']
    );

    if (teamOwner.rowCount === 0) {
      return res.status(403).json({ error: 'Nemáte oprávnění mazat tento tým.' });
    }

    await query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
    await query('DELETE FROM team WHERE team_id = $1', [teamId]);

    res.status(200).json({ message: 'Tým byl úspěšně smazán.' });
  } catch (error) {
    console.error('❌ Chyba při mazání týmu:', error);
    res.status(500).json({ error: 'Chyba při mazání týmu' });
  }
});

module.exports = router;
