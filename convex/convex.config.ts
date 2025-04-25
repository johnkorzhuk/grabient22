// convex/convex.config.ts
import { defineApp } from 'convex/server';
import migrations from '@convex-dev/migrations/convex.config';
import aggregate from '@convex-dev/aggregate/convex.config';

const app = defineApp();
app.use(migrations);
app.use(aggregate, { name: 'likesAggregate' });

export default app;
