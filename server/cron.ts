import cron from 'node-cron';
import { syncScenariosFromGitLab } from './scenarios';

// Active cron job
let activeJob: cron.ScheduledTask | null = null;

// Schedule regular syncing of scenarios
export function scheduleSync(accessToken: string, repoUrl: string) {
  // Cancel any existing job
  if (activeJob) {
    activeJob.stop();
  }
  
  // Schedule new job for every 6 hours
  activeJob = cron.schedule('0 */6 * * *', async () => {
    console.log('Scheduled sync: Syncing scenarios from GitLab');
    try {
      await syncScenariosFromGitLab(accessToken, repoUrl);
      console.log('Scheduled sync: Successfully synced scenarios');
    } catch (error) {
      console.error('Scheduled sync: Error syncing scenarios:', error);
    }
  });
  
  console.log('Scheduled scenario sync every 6 hours');
}
