import { Inject, Injectable, LoggerService } from "@nestjs/common"
import { WINSTON_MODULE_NEST_PROVIDER, WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from "winston"
import { InjectLogger } from "@share/logging"



@Injectable()
export class AppService {

  constructor(
    @InjectLogger() protected logger: Logger
  ) {
    this.logger.info({
      message: "Test",
      data: {
        id: 1
      }
    })
  }


}
