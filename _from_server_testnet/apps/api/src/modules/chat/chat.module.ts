import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Chat } from "@share/entities/chat.entity"
import { ChatMessage } from "@share/entities/chat-message.entity"
import { Deal } from "@share/entities/deal.entity"
import { ChatController } from "./chat.controller"
import { ChatService } from "./chat.service"
import { User } from "@share/entities/user.entity"
import { Response } from "@share/entities/response.entity"
import { Request } from "@share/entities/request.entity"
import { ChatGateway } from "./chat.gateway"
import { GeminiAssistantService } from "./gemini-assistant.service"

@Module({
  imports: [TypeOrmModule.forFeature([Chat, ChatMessage, Deal, User, Response, Request]), TypeOrmModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, GeminiAssistantService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}