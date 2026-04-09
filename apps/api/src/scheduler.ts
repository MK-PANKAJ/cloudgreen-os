import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

let redis: Redis | null = null;
let workloadQueue: Queue | null = null;

async function initializeQueue() {
  if (!redis) {
    redis = new Redis({
      host: '127.0.0.1',
      port: 6379,
      lazyConnect: true,
      connectTimeout: 1000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
  }
  if (!workloadQueue) {
    workloadQueue = new Queue('cloudgreen-workloads', { connection: redis });
  }
  return workloadQueue;
}

export async function getQueueMetrics() {
  try {
    const queue = await initializeQueue();
    const counts = await Promise.race([
      queue.getJobCounts('active', 'waiting', 'delayed', 'completed', 'failed'),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Queue metrics timeout')), 1200);
      }),
    ]);
    return counts;
  } catch (error) {
    console.warn('Queue metrics unavailable (Redis not running):', (error as Error).message);
    return { active: 0, waiting: 0, delayed: 0, completed: 0, failed: 0 };
  }
}

export function getWorkloadQueue() {
  return workloadQueue;
}