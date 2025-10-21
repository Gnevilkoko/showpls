import { SetMetadata } from "@nestjs/common"

export const NoCache = () => SetMetadata(`no-cache`, true)
