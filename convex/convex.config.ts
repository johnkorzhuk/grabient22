// convex/convex.config.ts
import { defineApp } from 'convex/server'
import migrations from '@convex-dev/migrations/convex.config'
import aggregate from '@convex-dev/aggregate/convex.config'
import resend from '@convex-dev/resend/convex.config'

const app = defineApp()
app.use(migrations)
app.use(aggregate, { name: 'likesAggregate' })
app.use(resend)

export default app
