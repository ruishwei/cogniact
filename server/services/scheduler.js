import cron from 'node-cron';
import { supabase } from '../config/supabase.js';

const scheduledJobs = new Map();

export function initializeScheduler() {
  console.log('Initializing task scheduler...');

  cron.schedule('* * * * *', async () => {
    await checkAndExecuteTasks();
  });
}

async function checkAndExecuteTasks() {
  try {
    const { data: tasks, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('enabled', true)
      .lte('next_run_at', new Date().toISOString());

    if (error) {
      console.error('Check tasks error:', error);
      return;
    }

    for (const task of tasks) {
      await executeTask(task);
    }
  } catch (error) {
    console.error('Check and execute tasks error:', error);
  }
}

async function executeTask(task) {
  try {
    const executionId = await createExecution(task.id);

    let result = {};
    let status = 'success';
    let error = null;

    try {
      switch (task.task_type) {
        case 'login':
          result = await executeLoginTask(task);
          break;
        case 'check':
          result = await executeCheckTask(task);
          break;
        case 'report':
          result = await executeReportTask(task);
          break;
        case 'custom':
          result = await executeCustomTask(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.task_type}`);
      }
    } catch (err) {
      status = 'failed';
      error = err.message;
      console.error(`Task execution error [${task.id}]:`, err);
    }

    await completeExecution(executionId, status, result, error);

    const nextRunAt = calculateNextRun(task.schedule);
    await supabase
      .from('scheduled_tasks')
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: nextRunAt.toISOString(),
      })
      .eq('id', task.id);
  } catch (error) {
    console.error('Execute task error:', error);
  }
}

async function createExecution(taskId) {
  const { data, error } = await supabase
    .from('task_executions')
    .insert({
      task_id: taskId,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data.id;
}

async function completeExecution(executionId, status, result, error) {
  await supabase
    .from('task_executions')
    .update({
      status,
      completed_at: new Date().toISOString(),
      result,
      error,
    })
    .eq('id', executionId);
}

function calculateNextRun(cronExpression) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  return now;
}

async function executeLoginTask(task) {
  return {
    message: 'Login task executed',
    timestamp: new Date().toISOString(),
  };
}

async function executeCheckTask(task) {
  return {
    message: 'Check task executed',
    timestamp: new Date().toISOString(),
  };
}

async function executeReportTask(task) {
  return {
    message: 'Report task executed',
    timestamp: new Date().toISOString(),
  };
}

async function executeCustomTask(task) {
  return {
    message: 'Custom task executed',
    timestamp: new Date().toISOString(),
  };
}
