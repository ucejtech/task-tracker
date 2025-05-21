import express from 'express';

export default function labelsRouter(db) {
  const router = express.Router();

  // Get all labels
  router.get('/', async (req, res) => {
    try {
      const labels = await db.all('SELECT * FROM labels ORDER BY name');
      res.json(labels);
    } catch (error) {
      console.error('Error getting labels:', error);
      res.status(500).json({ error: 'Failed to retrieve labels' });
    }
  });

  // Get a specific label by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const label = await db.get('SELECT * FROM labels WHERE id = ?', [id]);

      if (!label) {
        return res.status(404).json({ error: 'Label not found' });
      }

      res.json(label);
    } catch (error) {
      console.error('Error getting label:', error);
      res.status(500).json({ error: 'Failed to retrieve label' });
    }
  });

  // Create a new label
  router.post('/', async (req, res) => {
    try {
      const { name, color } = req.body;

      if (!name || !color) {
        return res.status(400).json({ error: 'Name and color are required' });
      }

      // Check for duplicate name
      const existingLabel = await db.get(
        'SELECT * FROM labels WHERE name = ?',
        [name]
      );

      if (existingLabel) {
        return res
          .status(409)
          .json({ error: 'Label with this name already exists' });
      }

      const result = await db.run(
        'INSERT INTO labels (name, color) VALUES (?, ?)',
        [name, color]
      );
      const labelId = result.lastID;

      const label = await db.get('SELECT * FROM labels WHERE id = ?', [
        labelId
      ]);

      res.status(201).json(label);
    } catch (error) {
      console.error('Error creating label:', error);
      res.status(500).json({ error: 'Failed to create label' });
    }
  });

  // Update a label
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, color } = req.body;

      if (!name && !color) {
        return res
          .status(400)
          .json({ error: 'At least one field (name or color) is required' });
      }

      // Check if label exists
      const existingLabel = await db.get('SELECT * FROM labels WHERE id = ?', [
        id
      ]);

      if (!existingLabel) {
        return res.status(404).json({ error: 'Label not found' });
      }

      // Check for duplicate name if name is being updated
      if (name && name !== existingLabel.name) {
        const duplicateLabel = await db.get(
          'SELECT * FROM labels WHERE name = ? AND id != ?',
          [name, id]
        );

        if (duplicateLabel) {
          return res
            .status(409)
            .json({ error: 'Label with this name already exists' });
        }
      }

      // Update fields
      await db.run(
        'UPDATE labels SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?',
        [name, color, id]
      );

      const updatedLabel = await db.get('SELECT * FROM labels WHERE id = ?', [
        id
      ]);

      res.json(updatedLabel);
    } catch (error) {
      console.error('Error updating label:', error);
      res.status(500).json({ error: 'Failed to update label' });
    }
  });

  // Delete a label
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Check if label exists
      const existingLabel = await db.get('SELECT * FROM labels WHERE id = ?', [
        id
      ]);

      if (!existingLabel) {
        return res.status(404).json({ error: 'Label not found' });
      }

      // Start a transaction
      await db.beginTransaction();

      try {
        // Delete label associations
        await db.run('DELETE FROM task_labels WHERE label_id = ?', [id]);

        // Delete label
        await db.run('DELETE FROM labels WHERE id = ?', [id]);

        // Commit transaction
        await db.commit();

        res.status(204).send();
      } catch (error) {
        // Rollback on error
        await db.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting label:', error);
      res.status(500).json({ error: 'Failed to delete label' });
    }
  });

  // Get tasks by label
  router.get('/:id/tasks', async (req, res) => {
    try {
      const { id } = req.params;

      // Check if label exists
      const existingLabel = await db.get('SELECT * FROM labels WHERE id = ?', [
        id
      ]);

      if (!existingLabel) {
        return res.status(404).json({ error: 'Label not found' });
      }

      const tasks = await db.all(
        `
        SELECT t.*
        FROM tasks t
        JOIN task_labels tl ON t.id = tl.task_id
        WHERE tl.label_id = ?
        ORDER BY t.created_at DESC
      `,
        [id]
      );

      res.json(tasks);
    } catch (error) {
      console.error('Error getting tasks by label:', error);
      res.status(500).json({ error: 'Failed to retrieve tasks' });
    }
  });

  return router;
}
