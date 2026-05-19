import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import type { AnalysisJobPayload } from '@/lib/types'

export const ANALYSIS_QUEUE = 'analysis'

let connection: Redis | null = null

export function getRedis(): Redis {
  if (!connection) {
    connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    })
  }
  return connection
}

let queue: Queue<AnalysisJobPayload> | null = null

export function getAnalysisQueue(): Queue<AnalysisJobPayload> {
  if (!queue) {
    queue = new Queue<AnalysisJobPayload>(ANALYSIS_QUEUE, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    })
  }
  return queue
}
