import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm"
import { Repository, Brackets, In, DataSource } from "typeorm"
import { Chat } from "@share/entities/chat.entity"
import { ChatMessage } from "@share/entities/chat-message.entity"
import { Deal } from "@share/entities/deal.entity"
import { User } from "@share/entities/user.entity"
import { Response } from "@share/entities/response.entity"
import { ChatListDto } from "./dto/chat-list.dto"
import { SendMessageDto } from "./dto/send-message.dto"
import { PaginationDto } from "../../common/dto/pagination.dto"
import { Role } from "@share/role.enum"
import { ChatGateway } from "./chat.gateway"

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly chatGateway: ChatGateway,
  ) {}

  async getOrCreateChat(user1Id: string, user2Id: string): Promise<Chat> {
    // Ensure consistent ordering to avoid duplicate chats (e.g. user1 < user2)
    // But the requirement says "Finds an existing chat between two users OR creates a new one."
    // And the entity has user1 and user2.
    // Let's check both combinations.

    let chat = await this.chatRepository.findOne({
      where: [
        { user1: { id: user1Id }, user2: { id: user2Id } },
        { user1: { id: user2Id }, user2: { id: user1Id } },
      ],
      relations: ["user1", "user2", "admin"],
    })

    if (!chat) {
      const user1 = await this.userRepository.findOneBy({ id: user1Id })
      const user2 = await this.userRepository.findOneBy({ id: user2Id })

      if (!user1 || !user2) {
        throw new NotFoundException("User not found")
      }

      chat = this.chatRepository.create({
        user1,
        user2,
        lastUpdate: new Date(),
      })
      await this.chatRepository.save(chat)
    }

    return chat
  }

  async updateChat(chat: Chat): Promise<Chat> {
    return this.chatRepository.save(chat)
  }

  async findAll(user: User, query: ChatListDto) {
    const { isFavorite, search, limit = 10, page = 1 } = query
    const offset = (page - 1) * limit

    const qb = this.chatRepository.createQueryBuilder("chat")
      .leftJoinAndSelect("chat.user1", "user1")
      .leftJoinAndSelect("chat.user2", "user2")
      .leftJoinAndSelect("chat.admin", "admin")
      .where(
        new Brackets((qb) => {
          qb.where("chat.user1Id = :userId", { userId: user.id })
            .orWhere("chat.user2Id = :userId", { userId: user.id })
        })
      )

    if (isFavorite) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where("chat.user1Id = :userId AND chat.isFavorite = :isFavorite", { userId: user.id, isFavorite: true })
            .orWhere("chat.user2Id = :userId AND chat.isFavorite2 = :isFavorite", { userId: user.id, isFavorite: true })
        })
      )
    }

    if (search) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where("user1.firstName ILIKE :search", { search: `%${search}%` })
            .orWhere("user1.lastName ILIKE :search", { search: `%${search}%` })
            .orWhere("user2.firstName ILIKE :search", { search: `%${search}%` })
            .orWhere("user2.lastName ILIKE :search", { search: `%${search}%` })
            .orWhere("chat.lastMessage ILIKE :search", { search: `%${search}%` })
        })
      )
    }

    // Sorting:
    // 1. isActiveOrder === true
    // 2. Showpls Agent (id = 0) - Assuming we handle this by ID or specific logic, but for now standard sorting
    // 3. lastUpdate DESC
    qb.orderBy("chat.isActiveOrder", "DESC")
      .addOrderBy("chat.lastUpdate", "DESC")

    const [items, total] = await qb
      .take(limit)
      .skip(offset)
      .getManyAndCount()

    // Calculate counts
    const countUnread = await this.calculateTotalUnread(user.id)
    const countUnreadFavorite = await this.calculateTotalUnreadFavorite(user.id)

    const mappedItems = items.map(chat => {
      const isUser1 = chat.user1.id === user.id
      const otherUser = isUser1 ? chat.user2 : chat.user1
      const myCountUnread = isUser1 ? chat.countUnread : chat.countUnread2
      const myIsFavorite = isUser1 ? chat.isFavorite : chat.isFavorite2

      return {
        chatId: chat.id,
        avatar: otherUser.avatar,
        firstName: otherUser.firstName,
        lastName: otherUser.lastName,
        lastMessage: chat.lastMessage,
        lastUpdate: chat.lastUpdate,
        isFavorite: myIsFavorite,
        isRead: myCountUnread === 0,
        countUnread: myCountUnread,
        isActiveOrder: chat.isActiveOrder,
        isArbitration: chat.isArbitration,
      }
    })

    return {
      items: mappedItems,
      total,
      countUnread,
      countUnreadFavorite,
    }
  }

  async findOne(id: string, user: User, query: PaginationDto & { search?: string }) {
    const chat = await this.chatRepository.findOne({
      where: { id },
      relations: ["user1", "user2", "admin"],
    })

    if (!chat) {
      throw new NotFoundException("Chat not found")
    }

    if (chat.user1.id !== user.id && chat.user2.id !== user.id && chat.admin?.id !== user.id) {
      throw new ForbiddenException("Access denied")
    }

    // Reset unread count
    if (chat.user1.id === user.id) {
      chat.countUnread = 0
    } else if (chat.user2.id === user.id) {
      chat.countUnread2 = 0
    }
    await this.chatRepository.save(chat)

    // Messages
    const messageQb = this.messageRepository.createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender")
      .leftJoinAndSelect("message.receiver", "receiver")
      .where("message.chatId = :chatId", { chatId: id })
      .orderBy("message.createdAt", "DESC")

    if (query.search) {
      messageQb.andWhere("message.text ILIKE :search", { search: `%${query.search}%` })
    }

    const limit = query.limit || 50
    const page = query.page || 1
    const offset = (page - 1) * limit

    const [messages, totalMessages] = await messageQb
      .take(limit)
      .skip(offset)
      .getManyAndCount()

    // Deals
    const deals = await this.dealRepository.find({
      where: [
        { customer: { id: chat.user1.id }, performer: { id: chat.user2.id } },
        { customer: { id: chat.user2.id }, performer: { id: chat.user1.id } },
      ],
      relations: ["request", "response"],
      order: { createdAt: "DESC" },
    })

    // Responses (for context)
    // "Все Response для задач в этом чате" - Assuming responses related to requests between these users?
    // Or maybe just responses where one is performer and other is customer?
    // The spec says "Все Response для задач в этом чате".
    // Let's fetch responses where (performer=user1 AND request.customer=user2) OR (performer=user2 AND request.customer=user1)
    const responses = await this.responseRepository.createQueryBuilder("response")
      .leftJoinAndSelect("response.request", "request")
      .leftJoinAndSelect("response.performer", "performer")
      .leftJoinAndSelect("request.customer", "customer")
      .where(
        new Brackets((qb) => {
          qb.where("performer.id = :u1 AND customer.id = :u2", { u1: chat.user1.id, u2: chat.user2.id })
            .orWhere("performer.id = :u2 AND customer.id = :u1", { u2: chat.user1.id, u1: chat.user2.id })
        })
      )
      .orderBy("response.createdAt", "DESC")
      .getMany()


    return {
      chat: {
        id: chat.id,
        user1: chat.user1,
        user2: chat.user2,
        admin: chat.admin,
        lastMessage: chat.lastMessage,
        lastUpdate: chat.lastUpdate,
        isFavorite: chat.user1.id === user.id ? chat.isFavorite : chat.isFavorite2,
        isActiveOrder: chat.isActiveOrder,
        isArbitration: chat.isArbitration,
      },
      messages: messages.reverse(), // Return in chronological order for UI usually, but API spec implies list. Let's keep it consistent with query (DESC) or reverse if needed. Usually chat APIs return latest first or oldest first depending on pagination strategy.
      // Spec says "GET /chat/:id ... Returns Chat + Messages (paginated)".
      // If I paginate DESC (newest first), then page 1 is newest messages.
      // The UI usually wants to show them bottom-up.
      // Let's return them as fetched (DESC) or reverse them?
      // "messages: Array<{...}>"
      // I will return them as fetched (DESC) so the client knows the order.
      // Actually, standard chat pagination often fetches newest first.
      // Let's stick to the query order (DESC).
      deals,
      responses,
      total: totalMessages,
      limit,
      page,
    }
  }

  async sendMessage(user: User, chatId: string, dto: SendMessageDto) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ["user1", "user2"],
    })

    if (!chat) {
      throw new NotFoundException("Chat not found")
    }

    if (chat.user1.id !== user.id && chat.user2.id !== user.id && chat.admin?.id !== user.id) {
      throw new ForbiddenException("Access denied")
    }

    const receiver = chat.user1.id === user.id ? chat.user2 : chat.user1

    // Use transaction to ensure data consistency
    const completeMessage = await this.dataSource.transaction(async (manager) => {
      const message = manager.create(ChatMessage, {
        chat,
        sender: user,
        receiver,
        text: dto.text,
        attachments: dto.attachments,
        type: dto.type,
        variant: dto.variant,
        isRead: false,
      })

      // Save the message
      const savedMessage = await manager.save(message)

      // Update chat with last message info and unread count
      chat.lastMessage = dto.text || (dto.attachments?.length ? "Attachment" : "Message")
      chat.lastUpdate = new Date()

      if (receiver.id === chat.user1.id) {
        chat.countUnread += 1
      } else {
        chat.countUnread2 += 1
      }

      await manager.save(chat)

      // Fetch the complete message with relations (sender and receiver)
      return await manager.findOne(ChatMessage, {
        where: { id: savedMessage.id },
        relations: ["sender", "receiver"],
      })
    })

    // Use the complete message with relations for notifications
    this.chatGateway.notifyReceiver(receiver.id, completeMessage, chat.id)
    this.chatGateway.notifyChatUpdate(receiver.id, chat.id, {
      lastMessage: chat.lastMessage,
      lastUpdate: chat.lastUpdate,
      countUnread: receiver.id === chat.user1.id ? chat.countUnread : chat.countUnread2,
    })
    this.chatGateway.notifyChatUpdate(user.id, chat.id, {
      lastMessage: chat.lastMessage,
      lastUpdate: chat.lastUpdate,
    })

    return completeMessage
  }

  async toggleFavorite(user: User, chatId: string, isFavorite: boolean) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ["user1", "user2"],
    })

    if (!chat) {
      throw new NotFoundException("Chat not found")
    }

    if (chat.user1.id !== user.id && chat.user2.id !== user.id) {
      throw new ForbiddenException("Access denied")
    }

    // Use transaction to ensure data consistency
    await this.dataSource.transaction(async (manager) => {
      if (chat.user1.id === user.id) {
        chat.isFavorite = isFavorite
      } else {
        chat.isFavorite2 = isFavorite
      }

      await manager.save(chat)
    })

    return {
      chatId: chat.id,
      isFavorite,
    }
  }

  async markRead(user: User, chatId: string, messageIds?: string[]) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ["user1", "user2"],
    })

    if (!chat) {
      throw new NotFoundException("Chat not found")
    }

    if (chat.user1.id !== user.id && chat.user2.id !== user.id) {
      throw new ForbiddenException("Access denied")
    }

    // Use transaction to ensure data consistency
    const result = await this.dataSource.transaction(async (manager) => {
      const qb = manager.createQueryBuilder()
        .update(ChatMessage)
        .set({ isRead: true })
        .where("chatId = :chatId", { chatId })
        .andWhere("receiverId = :userId", { userId: user.id })
        .andWhere("isRead = :isRead", { isRead: false })

      if (messageIds && messageIds.length > 0) {
        qb.andWhere("id IN (:...ids)", { ids: messageIds })
      }

      const updateResult = await qb.execute()

      // Update chat counters
      // We need to recalculate unread count for this user in this chat
      const count = await manager.count(ChatMessage, {
        where: {
          chat: { id: chatId },
          receiver: { id: user.id },
          isRead: false,
        },
      })

      if (chat.user1.id === user.id) {
        chat.countUnread = count
      } else {
        chat.countUnread2 = count
      }
      await manager.save(chat)

      return updateResult
    })

    const countUnread = await this.calculateTotalUnread(user.id)
    const countUnreadFavorite = await this.calculateTotalUnreadFavorite(user.id)

    this.chatGateway.notifyCountersUpdate(user.id, {
      countUnread,
      countUnreadFavorite,
    })
    this.chatGateway.notifyChatUpdate(user.id, chatId, {
      countUnread: chat.user1.id === user.id ? chat.countUnread : chat.countUnread2,
    })

    return {
      chatId,
      readCount: result.affected || 0,
    }
  }

  async joinAsAdmin(admin: User, chatId: string) {
    if (admin.role !== Role.Admin) {
      throw new ForbiddenException("Only admin can join")
    }

    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ["user1", "user2", "admin"],
    })

    if (!chat) {
      throw new NotFoundException("Chat not found")
    }

    if (!chat.isArbitration) {
      throw new ForbiddenException("Chat is not in arbitration")
    }

    // Use transaction to ensure data consistency
    const { completeMessage1, completeMessage2 } = await this.dataSource.transaction(async (manager) => {
      chat.admin = admin
      await manager.save(chat)

      // Send system message to both users
      const messageText = "Admin joined the chat"
      
      // Create message for user1
      const message1 = manager.create(ChatMessage, {
        chat,
        sender: admin,
        receiver: chat.user1,
        type: "notification",
        text: messageText,
        isRead: false,
      })
      const savedMessage1 = await manager.save(message1)
      const completeMessage1 = await manager.findOne(ChatMessage, {
        where: { id: savedMessage1.id },
        relations: ["sender", "receiver"],
      })

      // Create message for user2
      const message2 = manager.create(ChatMessage, {
        chat,
        sender: admin,
        receiver: chat.user2,
        type: "notification",
        text: messageText,
        isRead: false,
      })
      const savedMessage2 = await manager.save(message2)
      const completeMessage2 = await manager.findOne(ChatMessage, {
        where: { id: savedMessage2.id },
        relations: ["sender", "receiver"],
      })

      // Update chat with the system message
      chat.lastMessage = messageText
      chat.lastUpdate = new Date()
      await manager.save(chat)

      return { completeMessage1, completeMessage2 }
    })

    // Notify both users about the new message
    this.chatGateway.notifyReceiver(chat.user1.id, completeMessage1, chat.id)
    this.chatGateway.notifyReceiver(chat.user2.id, completeMessage2, chat.id)
    
    // Notify both users about chat update
    this.chatGateway.notifyChatUpdate(chat.user1.id, chat.id, {
      isArbitration: true,
      lastMessage: chat.lastMessage,
      lastUpdate: chat.lastUpdate,
    })
    this.chatGateway.notifyChatUpdate(chat.user2.id, chat.id, {
      isArbitration: true,
      lastMessage: chat.lastMessage,
      lastUpdate: chat.lastUpdate,
    })

    return {
      chat: {
        id: chat.id,
        admin: chat.admin,
        isArbitration: chat.isArbitration,
      },
    }
  }

  private async calculateTotalUnread(userId: string): Promise<number> {
    const chats = await this.chatRepository.find({
      where: [
        { user1: { id: userId } },
        { user2: { id: userId } },
      ],
      relations: ["user1", "user2"],
    })

    return chats.reduce((acc, chat) => {
      if (chat.user1 && chat.user1.id === userId) return acc + chat.countUnread
      if (chat.user2 && chat.user2.id === userId) return acc + chat.countUnread2
      return acc
    }, 0)
  }

  private async calculateTotalUnreadFavorite(userId: string): Promise<number> {
    const chats = await this.chatRepository.find({
      where: [
        { user1: { id: userId }, isFavorite: true },
        { user2: { id: userId }, isFavorite2: true },
      ],
      relations: ["user1", "user2"],
    })

    return chats.reduce((acc, chat) => {
      if (chat.user1 && chat.user1.id === userId) return acc + chat.countUnread
      if (chat.user2 && chat.user2.id === userId) return acc + chat.countUnread2
      return acc
    }, 0)
  }
}