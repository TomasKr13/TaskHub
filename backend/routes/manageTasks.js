router.put('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { title, description, time_estimate, task_type, priority } = req.body;

  try {
    const result = await query(
      `UPDATE tasks
       SET title = $1, description = $2, time_estimate = $3, task_type = $4, priority = $5
       WHERE task_id = $6
       RETURNING *`,
      [title, description, time_estimate, task_type, priority, taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Úkol nebyl nalezen.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Chyba při úpravě úkolu:', error);
    res.status(500).json({ error: 'Chyba při úpravě úkolu.' });
  }
});