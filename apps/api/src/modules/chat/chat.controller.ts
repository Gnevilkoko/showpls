import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common"
import { ApiSecurity, ApiTags } from "@nestjs/swagger"
import { ChatService } from "./chat.service"
import { GetUser } from "../user/decorators/get-user.decorator"
import { User } from "@share/entities/user.entity"
import { AuthGuard } from "../auth/guards/auth.guard"
import { AdminGuard } from "../auth/guards/admin.guard"
import { ChatListDto } from "./dto/chat-list.dto"
import { PaginationDto } from "../../common/dto/pagination.dto"
import { SendMessageDto } from "./dto/send-message.dto"
import { ToggleFavoriteDto } from "./dto/toggle-favorite.dto"
import { MarkReadDto } from "./dto/mark-read.dto"

@ApiTags("Chat")
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get("list")
  async findAll(@GetUser() user: User, @Query() query: ChatListDto) {
    return this.chatService.findAll(user, query)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @GetUser() user: User,
    @Query() query: PaginationDto & { search?: string }
  ) {
    return this.chatService.findOne(id, user, query)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Post(":id/message")
  async sendMessage(
    @Param("id") id: string,
    @GetUser() user: User,
    @Body() dto: SendMessageDto
  ) {
    return this.chatService.sendMessage(user, id, dto)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Post(":id/favorite")
  async toggleFavorite(
    @Param("id") id: string,
    @GetUser() user: User,
    @Body() dto: ToggleFavoriteDto
  ) {
    return this.chatService.toggleFavorite(user, id, dto.isFavorite)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Post(":id/read")
  async markRead(
    @Param("id") id: string,
    @GetUser() user: User,
    @Body() dto: MarkReadDto
  ) {
    return this.chatService.markRead(user, id, dto.messageIds)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard, AdminGuard)
  @Post(":id/join-as-admin")
  async joinAsAdmin(@Param("id") id: string, @GetUser() user: User) {
    return this.chatService.joinAsAdmin(user, id)
  }
}