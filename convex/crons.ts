import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

// Create a new cron job scheduler
const crons = cronJobs();

// Schedule the updatePopularCollections mutation to run every hour
// crons.interval(
//   'update-popular-collections',
//   { minutes: 15 },
//   internal.collections.updatePopularCollections,
//   { limit: 1000 },
// );

crons.interval(
  'update-collection-likes',
  { minutes: 15 },
  internal.collections.updateCollectionLikes,
);

export default crons;
