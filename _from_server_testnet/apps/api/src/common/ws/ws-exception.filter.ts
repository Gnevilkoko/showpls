import { ArgumentsHost, Catch, WsExceptionFilter as WEF } from "@nestjs/common"
import { BaseWsExceptionFilter } from "@nestjs/websockets"

@Catch(Error)
export class WsExceptionFilter extends BaseWsExceptionFilter implements WEF {
  catch(exception: any, host: ArgumentsHost): any {
    super.catch(exception, host)
    const client = host.switchToWs().getClient()
  }
}
