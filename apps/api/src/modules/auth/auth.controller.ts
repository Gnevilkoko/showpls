import { Body, Controller, Post } from "@nestjs/common"
import { ValidationPipe } from "../../common/validation"
import { SignInDto, SignInSchema } from "./dto/sign-in.dto"
import { AuthService } from "./auth.service"
import { ConfigService } from "../../config"
import ms from "ms"
import {pick} from "lodash"

@Controller("auth")
export class AuthController {
  protected accessTokenLifetime = ConfigService.isDevelopment() ? ms("72h") : ms("15m")

  constructor(
    protected service: AuthService
  ) {}

  @Post("sign-in")
  async signIn(
    @Body(new ValidationPipe(SignInSchema)) dto: SignInDto
  ) {
    const user = await this.service.authenticate(dto)
    return {
      user,
      accessToken: AuthService.generateToken(pick(user), this.accessTokenLifetime),
    }
  }
}
