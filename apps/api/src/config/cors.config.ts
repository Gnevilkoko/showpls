import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface"

export default function () {
  return {
    origin: [process.env.NGROK_URL],
    allowedHeaders: ["Origin", "Content-Type", "Accept", "Authorization", "User-Agent", "X-Requested-With"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  } as CorsOptions
}
