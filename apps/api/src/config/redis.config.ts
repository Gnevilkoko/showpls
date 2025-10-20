import * as process from "node:process"
import { z } from "zod"

export default () => {
  const schema = z.object({
    host: z.string(),
    port: z.coerce.number().int(),
    db: z.coerce.number().int(),
  })

  const data = schema.parse({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: process.env.REDIS_DB,
  })
  return {
    ...data,
    getDSN() {
      return `redis://${this.host}:${this.port}/${this.db}`
    },
  }
}
