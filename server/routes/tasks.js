import express from 'express';

export default function tasksRouter(db) {
  const router = express.Router();

  // Get all tasks
  router.get('/', async (req, res) => {
    try {
      const {
        status,
        priority,
        label,
        search,
        sort = 'created_at',
        order = 'desc'
      } = req.query;

      let query = `
        SELECT t.*, GROUP_CONCAT(l.id) as label_ids, GROUP_CONCAT(l.name) as label_names, 
        GROUP_CONCAT(l.color) as label_colors
        FROM tasks t
        LEFT JOIN task_labels tl ON t.id = tl.task_id
        LEFT JOIN labels l ON tl.label_id = l.id
      `;

      const whereConditions = [];
      const params = [];

      if (status) {
        whereConditions.push('t.status = ?');
        params.push(status);
      }

      if (priority) {
        whereConditions.push('t.priority = ?');
        params.push(priority);
      }

      if (label) {
        whereConditions.push('l.id = ?');
        params.push(label);
      }

      if (search) {
        whereConditions.push('(t.title LIKE ? OR t.description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }

      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }

      query += ` GROUP BY t.id ORDER BY t.${sort} ${order}`;

      const tasks = await db.all(query, params);

      // Process labels for each task
      const processedTasks = tasks.map((task) => {
        const result = { ...task };

        if (task.label_ids) {
          result.labels = task.label_ids.split(',').map((id, index) => ({
            id: parseInt(id),
            name: task.label_names.split(',')[index],
            color: task.label_colors.split(',')[index]
          }));
        } else {
          result.labels = [];
        }

        // Remove concatenated fields
        delete result.label_ids;
        delete result.label_names;
        delete result.label_colors;

        return result;
      });

      res.json(processedTasks);
    } catch (error) {
      console.error('Error getting tasks:', error);
      res.status(500).json({ error: 'Failed to retrieve tasks' });
    }
  });

  // Get a specific task by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const task = await db.get(
        `
        SELECT t.*, GROUP_CONCAT(l.id) as label_ids, GROUP_CONCAT(l.name) as label_names, 
        GROUP_CONCAT(l.color) as label_colors
        FROM tasks t
        LEFT JOIN task_labels tl ON t.id = tl.task_id
        LEFT JOIN labels l ON tl.label_id = l.id
        WHERE t.id = ?
        GROUP BY t.id
      `,
        [id]
      );

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Process labels
      const result = { ...task };

      if (task.label_ids) {
        result.labels = task.label_ids.split(',').map((labelId, index) => ({
          id: parseInt(labelId),
          name: task.label_names.split(',')[index],
          color: task.label_colors.split(',')[index]
        }));
      } else {
        result.labels = [];
      }

      // Remove concatenated fields
      delete result.label_ids;
      delete result.label_names;
      delete result.label_colors;

      res.json(result);
    } catch (error) {
      console.error('Error getting task:', error);
      res.status(500).json({ error: 'Failed to retrieve task' });
    }
  });

  // Create a new task
  router.post('/', async (req, res) => {
    try {
      const {
        title,
        description,
        status = 'pending',
        priority = 'medium',
        due_date,
        labels = []
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Start a transaction
      await db.beginTransaction();

      try {
        // Insert task
        const result = await db.run(
          `
          INSERT INTO tasks (title, description, status, priority, due_date)
          VALUES (?, ?, ?, ?, ?)
        `,
          [title, description, status, priority, due_date]
        );

        const taskId = result.lastID;

        // Add labels
        if (labels.length > 0) {
          for (const labelId of labels) {
            await db.run(
              'INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)',
              [taskId, labelId]
            );
          }
        }

        // Commit transaction
        await db.commit();

        // Get the created task with labels
        const task = await db.get(
          `
          SELECT t.*, GROUP_CONCAT(l.id) as label_ids, GROUP_CONCAT(l.name) as label_names, 
          GROUP_CONCAT(l.color) as label_colors
          FROM tasks t
          LEFT JOIN task_labels tl ON t.id = tl.task_id
          LEFT JOIN labels l ON tl.label_id = l.id
          WHERE t.id = ?
          GROUP BY t.id
        `,
          [taskId]
        );

        // Process labels
        const processedTask = { ...task };

        if (task.label_ids) {
          processedTask.labels = task.label_ids.split(',').map((id, index) => ({
            id: parseInt(id),
            name: task.label_names.split(',')[index],
            color: task.label_colors.split(',')[index]
          }));
        } else {
          processedTask.labels = [];
        }

        // Remove concatenated fields
        delete processedTask.label_ids;
        delete processedTask.label_names;
        delete processedTask.label_colors;

        res.status(201).json(processedTask);
      } catch (error) {
        // Rollback on error
        await db.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Update a task
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, status, priority, due_date, labels } =
        req.body;

      // Check if task exists
      const existingTask = await db.get('SELECT * FROM tasks WHERE id = ?', [
        id
      ]);

      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Start a transaction
      await db.beginTransaction();

      try {
        // Update task
        await db.run(
          `
          UPDATE tasks
          SET title = COALESCE(?, title),
              description = COALESCE(?, description),
              status = COALESCE(?, status),
              priority = COALESCE(?, priority),
              due_date = COALESCE(?, due_date),
              updated_at = datetime('now')
          WHERE id = ?
        `,
          [title, description, status, priority, due_date, id]
        );

        // Update labels if provided
        if (labels) {
          // Remove existing labels
          await db.run('DELETE FROM task_labels WHERE task_id = ?', [id]);

          // Add new labels
          if (labels.length > 0) {
            for (const labelId of labels) {
              await db.run(
                'INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)',
                [id, labelId]
              );
            }
          }
        }

        // Commit transaction
        await db.commit();

        // Get the updated task with labels
        const task = await db.get(
          `
          SELECT t.*, GROUP_CONCAT(l.id) as label_ids, GROUP_CONCAT(l.name) as label_names, 
          GROUP_CONCAT(l.color) as label_colors
          FROM tasks t
          LEFT JOIN task_labels tl ON t.id = tl.task_id
          LEFT JOIN labels l ON tl.label_id = l.id
          WHERE t.id = ?
          GROUP BY t.id
        `,
          [id]
        );

        // Process labels
        const processedTask = { ...task };

        if (task && task.label_ids) {
          processedTask.labels = task.label_ids
            .split(',')
            .map((labelId, index) => ({
              id: parseInt(labelId),
              name: task.label_names.split(',')[index],
              color: task.label_colors.split(',')[index]
            }));
        } else {
          processedTask.labels = [];
        }

        // Remove concatenated fields
        delete processedTask.label_ids;
        delete processedTask.label_names;
        delete processedTask.label_colors;

        res.json(processedTask);
      } catch (error) {
        // Rollback on error
        await db.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Delete a task
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Check if task exists
      const existingTask = await db.get('SELECT * FROM tasks WHERE id = ?', [
        id
      ]);

      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Start a transaction
      await db.beginTransaction();

      try {
        // Delete task labels
        await db.run('DELETE FROM task_labels WHERE task_id = ?', [id]);

        // Delete task
        await db.run('DELETE FROM tasks WHERE id = ?', [id]);

        // Commit transaction
        await db.commit();

        res.status(204).send();
      } catch (error) {
        // Rollback on error
        await db.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  return router;
}
