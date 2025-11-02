import { Injectable, Logger } from "@nestjs/common"

@Injectable()
export class TONTopUpService {
  protected logger = new Logger(TONTopUpService.name)

  constructor() {}
}
