import cron from 'node-cron';
import { isPostgresMode, getDb } from '../config/db.js';
import { supabase } from '../config/supabase.js';
import { createPgAdapter } from '../config/pg-adapter.js';

let dbClient = null;

async function getQueryClient() {
  if (dbClient) return dbClient;
  if (isPostgresMode()) {
    const pool = await getDb();
    dbClient = createPgAdapter(pool);
  } else {
    dbClient = supabase;
  }
  return dbClient;
}

export function initializeScheduler() {
  console.log('Initializing task scheduler...');
  cron.schedule('* * * * *', async () => {
    await checkAndExecuteTasks();
  });
}

async function checkAndExecuteTasks() {
  try {
    const client = await getQueryClient();
    const { data: tasks, error } = await client
      .from('scheduled_tasks')
      .select('*')
      .eq('enabled', true)
      .lte('next_run_at', new Date().toISOString());

    if (error) {
      console.error('Check tasks error:', error);
      return;
    }

    for (const task of (tasks || [])) {
      await executeTask(task, client);
    }
  } catch (error) {
    console.error('Check and execute tasks error:', error);
  }
}

async function executeTask(task, client) {
  try {
    const { data: exec } = await client
      .from('task_executions')
      .insert({
        task_id: task.id,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .single();

    const executionId = exec?.id;

    let result = {};
    let status = 'success';
    let taskError = null;

    try {
      switch (task.task_type) {
        case 'login':  result = { message: 'Login task executed', timestamp: new Date().toISOString() }; break;
        case 'check':  result = { message: 'Check task executed', timestamp: new Date().toISOString() }; break;
        case 'report': result = { message: 'Report task executed', timestamp: new Date().toISOString() }; break;
        default:       result = { message: `Task type ${task.task_type} executed` };
      }
    } catch (err) {
      status = 'failed';
      taskError = err.message;
    }

    if (executionId) {
      await client.from('task_executions').update({
        status,
        completed_at: new Date().toISOString(),
        result,
        error: taskError,
      }).eq('id', executionId);
    }

    const nextRunAt = new Date();
    nextRunAt.setMinutes(nextRunAt.getMinutes() + 1);

    await client.from('scheduled_tasks').update({
      last_run_at: new Date().toISOString(),
      next_run_at: nextRunAt.toISOString(),
    }).eq('id', task.id);
  } catch (error) {
    console.error('Execute task error:', error);
  }
}
