import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common"
import { ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger"
import { NotificationService } from "./notification.service"
import { GetUser } from "../user/decorators/get-user.decorator"
import { User } from "@share/entities/user.entity"
import { AuthGuard } from "../auth/guards/auth.guard"
import { PaginationDto } from "../../common/dto/pagination.dto"

@ApiTags("Notification")
@Controller("notification")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Get user notifications" })
  @UseGuards(AuthGuard)
  @Get("list")
  async findAll(@GetUser() user: User, @Query() query: PaginationDto) {
    return this.notificationService.findAll(user.id, {
      limit: query.limit,
      offset: query.page ? (query.page - 1) * (query.limit || 20) : 0,
    })
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Get unread notification count" })
  @UseGuards(AuthGuard)
  @Get("count-unread")
  async countUnread(@GetUser() user: User) {
    const count = await this.notificationService.countUnread(user.id)
    return { countUnread: count }
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Mark notification as read" })
  @UseGuards(AuthGuard)
  @Post(":id/read")
  async markRead(@Param("id") id: string, @GetUser() user: User) {
    return this.notificationService.markRead(id, user.id)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Mark all notifications as read" })
  @UseGuards(AuthGuard)
  @Post("read-all")
  async markAllRead(@GetUser() user: User) {
    return this.notificationService.markAllRead(user.id)
  }
}
