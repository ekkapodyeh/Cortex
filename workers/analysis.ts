import { Worker } from 'bullmq'
import { getRedis, ANALYSIS_QUEUE } from '@/lib/queue'
import { runAnalysis } from '@/lib/analysis'
import type { AnalysisJobPayload } from '@/lib/types'

const worker = new Worker<AnalysisJobPayload>(
  ANALYSIS_QUEUE,
  async (job) => {
    console.log(`[worker] processing job ${job.id} — commit ${job.data.commitSha}`)
    await runAnalysis(job.data)
    console.log(`[worker] done job ${job.id}`)
  },
  { connection: getRedis(), concurrency: 2 }
)

worker.on('failed', (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err.message)
})

console.log('[worker] analysis worker started')
