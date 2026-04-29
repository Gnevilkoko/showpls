import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets"
import { Server, Socket } from "socket.io"
import { Logger } from "@nestjs/common"
import AuthService from "../auth/auth.service"
import { UserPayload } from "@share/user.payload"
import { isOriginAllowed } from "../../config/cors.config"

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => (isOriginAllowed(origin) ? callback(null, true) : callback(new Error("Not allowed by CORS"))),
    credentials: true,
  },
  path: "/chat/ws",
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private logger = new Logger(ChatGateway.name)
  private userSockets = new Map<string, Set<string>>() // userId -> Set<socketId>

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token || client.handshake.headers.authorization?.split(" ")[1]

      if (!token || typeof token !== "string") {
        this.logger.warn(`Connection attempt without token: ${client.id}`)
        client.disconnect()
        return
      }

      const payload = AuthService.verifySignature<UserPayload>(token)
      if (!payload || !payload.id) {
        this.logger.warn(`Invalid token for client: ${client.id}`)
        client.disconnect()
        return
      }

      const userId = payload.id
      this.addUserSocket(userId, client.id)
      client.data.userId = userId

      this.logger.log(`Client connected: ${client.id}, User: ${userId}`)

      client.emit("connected", {
        type: "connected",
        userId,
        timestamp: new Date().toISOString(),
      })
    } catch (e) {
      this.logger.error(`Connection error: ${(e as Error).message}`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId
    if (userId) {
      this.removeUserSocket(userId, client.id)
      this.logger.log(`Client disconnected: ${client.id}, User: ${userId}`)
    }
  }

  notifyReceiver(receiverId: string, message: any, chatId: string) {
    const sockets = this.userSockets.get(receiverId)

    const payload = {
      type: "message:new",
      chatId,
      message: {
        id: message.id,
        type: message.type,
        variant: message.variant,
        sender: message.sender,
        receiver: message.receiver,
        text: message.text,
        requestId: message.requestId ?? null,
        responseId: message.responseId ?? null,
        attachments: message.attachments ?? [],
        createdAt: message.createdAt,
        isRead: message.isRead,
      },
    }

    if (sockets) {
      sockets.forEach((socketId) => {
        this.logger.debug(`[notifyReceiver] Emitting to socket ${socketId}:`, payload)
        this.server.to(socketId).emit("message:new", payload)
      })
    } else {
      this.logger.warn(`[notifyReceiver] No sockets found for receiverId=${receiverId}`)
    }
  }

  /** Собеседник «печатает» (например, ассистент Gemini готовит ответ). */
  notifyTyping(userId: string, chatId: string, typing: boolean) {
    const sockets = this.userSockets.get(userId)
    if (!sockets) return
    const payload = { type: "chat:typing" as const, chatId, typing }
    sockets.forEach((socketId) => {
      this.server.to(socketId).emit("chat:typing", payload)
    })
  }

  notifyChatUpdate(userId: string, chatId: string, updates: any) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit("chat:update", {
          type: "chat:update",
          chatId,
          updates,
        })
      })
    }
  }

  notifyCountersUpdate(userId: string, counters: { countUnread: number; countUnreadFavorite: number }) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit("counters:update", {
          type: "counters:update",
          ...counters,
        })
      })
    }
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set())
    }
    this.userSockets.get(userId)?.add(socketId)
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.delete(socketId)
      if (sockets.size === 0) {
        this.userSockets.delete(userId)
      }
    }
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId)
  }

  sendNotification(userId: string, notification: any) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit("notification", notification)
      })
    }
  }

  /**
   * Notify users about order status changes
   */
  notifyOrderStatusChanged(
    userId: string,
    orderId: string,
    status: string,
    chatId?: string,
    escrowStatus?: string | null
  ) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit("order:status_changed", {
          type: "order:status_changed",
          orderId,
          chatId,
          status,
          escrowStatus: escrowStatus || undefined,
          timestamp: new Date().toISOString(),
        })
      })
    }
  }

  /**
   * Notify users about proposal status changes
   */
  notifyProposalStatusChanged(userId: string, proposalId: string, status: string, chatId?: string) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit("proposal:status_changed", {
          type: "proposal:status_changed",
          proposalId,
          status,
          chatId,
          timestamp: new Date().toISOString(),
        })
      })
    }
  }

  /**
   * Уведомляет участников чата об удалении сообщения (чтобы UI обновился без перезагрузки).
   */
  notifyMessageDeleted(
    userIds: string[],
    chatId: string,
    messageId: string,
    chatUpdates?: { lastMessage: string; lastUpdate: Date }
  ) {
    const payload = {
      type: "message:deleted",
      chatId,
      messageId,
      lastMessage: chatUpdates?.lastMessage,
      lastUpdate: chatUpdates?.lastUpdate?.toISOString?.(),
    }
    const normalizedIds = [...new Set(userIds.map((id) => String(id)))]
    normalizedIds.forEach((userId) => {
      const sockets = this.userSockets.get(userId)
      if (sockets) {
        sockets.forEach((socketId) => {
          this.server.to(socketId).emit("message:deleted", payload)
        })
      }
    })
  }

  /**
   * Notify users that admin joined the chat
   */
  notifyAdminJoined(userId: string, chatId: string, adminData: any) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit("admin:joined", {
          type: "admin:joined",
          chatId,
          admin: adminData,
          timestamp: new Date().toISOString(),
        })
      })
    }
  }
}
