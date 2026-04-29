import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common"
import { ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger"
import { AuthGuard } from "../auth/guards/auth.guard"
import { GetUser } from "../user/decorators/get-user.decorator"
import { User } from "@share/entities"
import { SubmissionService } from "./submission.service"
import { CreateSubmissionDto } from "./dto/create-submission.dto"
import { RejectSubmissionDto } from "./dto/reject-submission.dto"

@ApiTags("Submission")
@Controller("submission")
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Post("create")
  @ApiOperation({ summary: "Create a new submission (proof of work)" })
  async create(@GetUser() user: User, @Body() dto: CreateSubmissionDto) {
    try {
      return await this.submissionService.create(user, dto)
    } catch (error) {
      throw error // Let the global exception filter handle it
    }
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get(":id")
  @ApiOperation({ summary: "Get submission details" })
  async findOne(@GetUser() user: User, @Param("id") id: string) {
    try {
      return await this.submissionService.findOne(id, user)
    } catch (error) {
      throw error // Let the global exception filter handle it
    }
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Post("reject")
  @ApiOperation({ summary: "Reject the latest submission (customer only). Notifies performer." })
  async reject(@GetUser() user: User, @Body() dto: RejectSubmissionDto) {
    return await this.submissionService.reject(user, dto)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get("request/:requestId")
  @ApiOperation({ summary: "Get latest submission for a request" })
  async findByRequest(@GetUser() user: User, @Param("requestId") requestId: string) {
    try {
      return await this.submissionService.findByRequest(requestId, user)
    } catch (error) {
      throw error // Let the global exception filter handle it
    }
  }
}