// TODO: This function is not deployed yet. This is a starter template.
// In order to deploy, make changes using the editFile tool and it will be auto deployed.
// Note: Logs arrive ~2 minutes later in getFunctionLogs.

interface Env {
  MAGICALLY_PROJECT_ID: string;
  MAGICALLY_API_BASE_URL: string;
  MAGICALLY_API_KEY: string;  // Required for cron jobs
}

interface ScheduledController {
  scheduledTime: number;
  cron: string;
  noRetry(): void;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const timestamp = new Date(controller.scheduledTime).toISOString();
    console.log(`[CRON] Executed at ${timestamp}, pattern: ${controller.cron}`);
    
    try {
      // TODO: Add your scheduled task logic here
      // Example: Clean up old data
      // const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      // await fetch(`${env.MAGICALLY_API_BASE_URL}/data/raw`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${env.MAGICALLY_API_KEY}`,
      //     'X-Project-ID': env.MAGICALLY_PROJECT_ID,
      //   },
      //   body: JSON.stringify({
      //     collection: 'temp_data',
      //     operation: 'deleteMany',
      //     query: { createdAt: { $lt: thirtyDaysAgo } }
      //   }),
      // });

      // Log successful execution
      const logResponse = await fetch(`${env.MAGICALLY_API_BASE_URL}/data/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.MAGICALLY_API_KEY}`,
          'X-Project-ID': env.MAGICALLY_PROJECT_ID,
        },
        body: JSON.stringify({
          collection: 'cron_logs',
          document: {
            job: 'example-cron',
            executedAt: new Date(controller.scheduledTime),
            status: 'success'
          },
        }),
      });

      if (!logResponse.ok) {
        console.error('[CRON] Failed to log execution:', await logResponse.text());
      }

    } catch (error) {
      console.error('[CRON] Failed:', error);
      controller.noRetry(); // Prevent retry to save costs
    }
  }
};