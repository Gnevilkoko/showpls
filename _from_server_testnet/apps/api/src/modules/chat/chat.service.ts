import { forwardRef, Inject, Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm"
import { Repository, Brackets, In, DataSource, Not, QueryFailedError } from "typeorm"
import { Chat } from "@share/entities/chat.entity"
import { ChatMessage } from "@share/entities/chat-message.entity"
import { Deal } from "@share/entities/deal.entity"
import { User } from "@share/entities/user.entity"
import { Response } from "@share/entities/response.entity"
import { Request } from "@share/entities/request.entity"
import { ChatListDto } from "./dto/chat-list.dto"
import { SendMessageDto } from "./dto/send-message.dto"
import { PaginationDto } from "../../common/dto/pagination.dto"
import { Role } from "@share/role.enum"
import { ChatGateway } from "./chat.gateway"
import { GeminiAssistantService } from "./gemini-assistant.service"

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
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly chatGateway: ChatGateway,
    @Inject(forwardRef(() => GeminiAssistantService))
    private readonly geminiAssistant: GeminiAssistantService
  ) {}

  async getOrCreateChat(user1Id: string, user2Id: string, manager?: DataSource): Promise<Chat> {
    // Ensure consistent ordering to avoid duplicate chats (e.g. user1 < user2)
    // But the requirement says "Finds an existing chat between two users OR creates a new one."
    // And the entity has user1 and user2.
    // Let's check both combinations.

    const chatRepo = manager ? manager.getRepository(Chat) : this.chatRepository
    const userRepo = manager ? manager.getRepository(User) : this.userRepository

    let chat = await chatRepo.findOne({
      where: [
        { user1: { id: user1Id }, user2: { id: user2Id } },
        { user1: { id: user2Id }, user2: { id: user1Id } },
      ],
      relations: ["user1", "user2", "admin"],
    })

    if (!chat) {
      const user1 = await userRepo.findOneBy({ id: user1Id })
      const user2 = await userRepo.findOneBy({ id: user2Id })

      if (!user1 || !user2) {
        throw new NotFoundException("User not found")
      }

      chat = chatRepo.create({
        user1,
        user2,
        lastUpdate: new Date(),
      })
      await chatRepo.save(chat)
    }

    return chat
  }

  async updateChat(chat: Chat): Promise<Chat> {
    return this.chatRepository.save(chat)
  }

  async findAll(user: User, query: ChatListDto) {
    const { isFavorite, search, limit = 10, page = 1, scope } = query
    const offset = (page - 1) * limit

    const qb = this.chatRepository
      .createQueryBuilder("chat")
      .leftJoinAndSelect("chat.user1", "user1")
      .leftJoinAndSelect("chat.user2", "user2")
      .leftJoinAndSelect("chat.admin", "admin")

    const isAdminGlobalList =
      user.role === Role.Admin && (scope === "all" || scope === "support")
    if (!isAdminGlobalList) {
      qb.where(
        new Brackets((qb) => {
          qb.where("chat.user1Id = :userId", { userId: user.id }).orWhere("chat.user2Id = :userId", { userId: user.id })
        })
      )
    }

    if (user.role === Role.Admin && scope === "support") {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where("user1.username = :supportAgent", { supportAgent: ChatService.SUPPORT_AGENT_USERNAME }).orWhere(
            "user2.username = :supportAgent",
            { supportAgent: ChatService.SUPPORT_AGENT_USERNAME }
          )
        })
      )
    }

    if (isFavorite) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where("chat.user1Id = :userId AND chat.isFavorite = :isFavorite", {
            userId: user.id,
            isFavorite: true,
          }).orWhere("chat.user2Id = :userId AND chat.isFavorite2 = :isFavorite", { userId: user.id, isFavorite: true })
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
    qb.orderBy("chat.isActiveOrder", "DESC").addOrderBy("chat.lastUpdate", "DESC")

    const [items, total] = await qb.take(limit).skip(offset).getManyAndCount()

    // Calculate counts
    const countUnread = await this.calculateTotalUnread(user.id)
    const countUnreadFavorite = await this.calculateTotalUnreadFavorite(user.id)

    const chatIds = items.map((c) => c.id)
    const activeDeals =
      chatIds.length > 0
        ? await this.dealRepository.find({
            where: { chat: { id: In(chatIds) } },
            relations: ["request", "chat"],
            order: { createdAt: "DESC" },
          })
        : []

    const dealsByChat = new Map<string, typeof activeDeals>()
    for (const deal of activeDeals) {
      const chatId = typeof deal.chat === "object" ? (deal.chat as any).id : deal.chat
      if (!dealsByChat.has(chatId)) dealsByChat.set(chatId, [])
      dealsByChat.get(chatId)!.push(deal)
    }

    const mappedItems = items.map((chat) => {
      const isUser1 = chat.user1.id === user.id
      const otherUser = isUser1 ? chat.user2 : chat.user1
      const myCountUnread = isUser1 ? chat.countUnread : chat.countUnread2
      const myIsFavorite = isUser1 ? chat.isFavorite : chat.isFavorite2
      const chatDeals = dealsByChat.get(chat.id) || []
      const latestDeal = chatDeals[0] || null
      const isSupportChatForUser =
        this.isSupportAgent(chat.user1) || this.isSupportAgent(chat.user2)

      const userSide = isSupportChatForUser
        ? (this.isSupportAgent(chat.user1) ? chat.user2 : chat.user1)
        : null

      const base = {
        chatId: chat.id,
        avatar: isSupportChatForUser ? "/favicon.svg" : otherUser.avatar,
        firstName: isSupportChatForUser ? "Showpls" : otherUser.firstName,
        lastName: isSupportChatForUser ? "Agent" : otherUser.lastName,
        lastMessage: chat.lastMessage,
        lastUpdate: chat.lastUpdate,
        isFavorite: myIsFavorite,
        isRead: myCountUnread === 0,
        countUnread: myCountUnread,
        isActiveOrder: chat.isActiveOrder,
        isArbitration: chat.isArbitration,
        activeRequestTitle: latestDeal?.request?.title || null,
        activeRequestPrice: latestDeal?.request?.price || null,
        dealsCount: chatDeals.length,
      }

      if (isAdminGlobalList) {
        return {
          ...base,
          user1: { id: chat.user1.id, firstName: chat.user1.firstName, lastName: chat.user1.lastName, avatar: chat.user1.avatar },
          user2: { id: chat.user2.id, firstName: chat.user2.firstName, lastName: chat.user2.lastName, avatar: chat.user2.avatar },
          isSupportChat: isSupportChatForUser,
          supportUserId: userSide?.id ?? null,
          supportUserName: userSide ? `${userSide.firstName} ${userSide.lastName || ""}`.trim() : null,
          supportUserAvatar: userSide?.avatar ?? null,
        }
      }

      return base
    })

    return {
      items: mappedItems,
      total,
      countUnread,
      countUnreadFavorite,
    }
  }

  static readonly SUPPORT_AGENT_TG_ID = "0"
  static readonly SUPPORT_AGENT_USERNAME = "showpls-support-agent"

  private async getOrCreateSupportAgent(): Promise<User> {
    const whereAgent = { username: ChatService.SUPPORT_AGENT_USERNAME }
    let agent = await this.userRepository.findOne({ where: whereAgent })
    if (agent) return agent

    const draft = this.userRepository.create({
      tgId: ChatService.SUPPORT_AGENT_TG_ID,
      username: ChatService.SUPPORT_AGENT_USERNAME,
      firstName: "Showpls",
      lastName: "Agent",
      avatar: "/favicon.svg",
      role: Role.Admin,
      languageCode: "en" as any,
      banned: false,
      isAvailable: false,
      lastSeenAt: new Date(),
      about: null,
      city: null,
      lastKnownLocation: null,
      locationUpdatedAt: null,
    })
    try {
      return await this.userRepository.save(draft)
    } catch (e) {
      // Два параллельных POST /chat/support (напр. React StrictMode) — второй INSERT ловит unique violation.
      if (e instanceof QueryFailedError && (e as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === "23505") {
        agent = await this.userRepository.findOne({ where: whereAgent })
        if (agent) return agent
      }
      throw e
    }
  }

  isSupportAgent(user: User | null | undefined): boolean {
    if (!user) return false
    return user.username === ChatService.SUPPORT_AGENT_USERNAME
  }

  /**
   * Сообщение от лица Showpls Agent без живого автора — ответ ассистента Gemini.
   */
  async postSupportAssistantMessage(chatId: string, text: string): Promise<void> {
    const agent = await this.getOrCreateSupportAgent()
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ["user1", "user2", "admin"],
    })
    if (!chat || !(this.isSupportAgent(chat.user1) || this.isSupportAgent(chat.user2))) return

    const receiver = this.isSupportAgent(chat.user1) ? chat.user2 : chat.user1
    const dto: SendMessageDto = { type: "message", text }

    const completeMessage = await this.dataSource.transaction(async (txManager) => {
      return this.sendMessageWithManager(
        agent,
        chat,
        receiver,
        false,
        dto,
        txManager.getRepository(Chat),
        txManager.getRepository(ChatMessage),
        null
      )
    })

    if (!completeMessage) return

    const broadcastTargetIds = [String(receiver.id)]
    broadcastTargetIds.forEach((targetId) => {
      this.chatGateway.notifyReceiver(targetId, completeMessage, chat.id)
      this.chatGateway.notifyChatUpdate(targetId, chat.id, {
        lastMessage: chat.lastMessage,
        lastUpdate: chat.lastUpdate,
        countUnread: targetId === String(chat.user1.id) ? chat.countUnread : chat.countUnread2,
      })
    })
    this.chatGateway.notifyReceiver(String(agent.id), completeMessage, chat.id)
    this.chatGateway.notifyChatUpdate(String(agent.id), chat.id, {
      lastMessage: chat.lastMessage,
      lastUpdate: chat.lastUpdate,
      countUnread: String(agent.id) === String(chat.user1.id) ? chat.countUnread : chat.countUnread2,
    })
  }

  async getOrCreateSupportChat(user: User): Promise<{ chatId: string }> {
    const agent = await this.getOrCreateSupportAgent()

    if (String(user.id) === String(agent.id)) {
      throw new ForbiddenException("Support agent cannot open support chat with itself")
    }

    const chat = await this.getOrCreateChat(String(user.id), String(agent.id))
    return { chatId: chat.id }
  }

  /** Нормализация id (bigint из БД — строка, из JWT payload — может быть number). */
  private static normalizeUserId(v: unknown): string {
    if (v == null || v === "") return ""
    if (typeof v === "bigint") return String(v)
    return String(v)
  }

  async findOne(id: string, user: User, query: PaginationDto & { search?: string }) {
    const currentId = ChatService.normalizeUserId(user?.id)
    if (!currentId) {
      throw new ForbiddenException("Access denied")
    }

    const rawRow = await this.chatRepository
      .createQueryBuilder("chat")
      .select("chat.id", "cid")
      .addSelect("chat.user1Id", "user1Id")
      .addSelect("chat.user2Id", "user2Id")
      .addSelect("chat.adminId", "adminId")
      .where("chat.id = :id", { id })
      .getRawOne<Record<string, unknown>>()

    if (!rawRow) {
      throw new NotFoundException("Chat not found")
    }

    // PostgreSQL/driver может вернуть ключи в нижнем регистре (user1id, user2id, adminid)
    const u1 = ChatService.normalizeUserId(rawRow.user1Id ?? rawRow.user1id)
    const u2 = ChatService.normalizeUserId(rawRow.user2Id ?? rawRow.user2id)
    const adminId = ChatService.normalizeUserId(rawRow.adminId ?? rawRow.adminid)

    const isParticipant = currentId === u1 || currentId === u2 || currentId === adminId || user.role === Role.Admin
    if (!isParticipant) {
      throw new ForbiddenException("Access denied")
    }

    const chat = await this.chatRepository.findOne({
      where: { id },
      relations: ["user1", "user2", "admin"],
    })
    if (!chat) {
      throw new NotFoundException("Chat not found")
    }

    // Reset unread count
    if (currentId === u1) {
      chat.countUnread = 0
    } else if (currentId === u2) {
      chat.countUnread2 = 0
    }
    await this.chatRepository.save(chat)

    // Messages
    const messageQb = this.messageRepository
      .createQueryBuilder("message")
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

    const [messages, totalMessages] = await messageQb.take(limit).skip(offset).getManyAndCount()

    const deals = await this.dealRepository.find({
      where: { chat: { id: chat.id } },
      relations: ["request", "response", "request.customer", "response.performer"],
      order: { createdAt: "DESC" },
    })

    const dealRequestIds = deals.map((d) => d.request?.id).filter(Boolean)

    const allRequestsInChat = await this.requestRepository.find({
      where: [{ customer: { id: chat.user1.id } }, { customer: { id: chat.user2.id } }],
      relations: ["customer"],
    })

    const allRequestIds = [...new Set([...dealRequestIds, ...allRequestsInChat.map((r) => r.id)])]

    const responses =
      allRequestIds.length > 0
        ? await this.responseRepository.find({
            where: { request: { id: In(allRequestIds) } },
            relations: ["request", "performer", "request.customer", "performer"],
            order: { createdAt: "DESC" },
          })
        : []

    return {
      chat: {
        id: chat.id,
        user1: chat.user1,
        user2: chat.user2,
        admin: chat.admin,
        lastMessage: chat.lastMessage,
        lastUpdate: chat.lastUpdate,
        isFavorite: currentId === u1 ? chat.isFavorite : chat.isFavorite2,
        isActiveOrder: chat.isActiveOrder,
        isArbitration: chat.isArbitration,
        isRead: true, // При открытии чата countUnread сбрасывается в 0 (строки 166-172)
        countUnread: 0, // Всегда 0 после открытия чата
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

  /**
   * Удаляет сообщение. Только отправитель может удалить своё сообщение.
   * Системные уведомления (type === "notification") удалять нельзя.
   * После удаления при необходимости обновляет lastMessage в чате.
   */
  async deleteMessage(user: User, chatId: string, messageId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ["chat", "sender"],
    })

    if (!message) {
      throw new NotFoundException("Message not found")
    }

    if (message.chat.id !== chatId) {
      throw new NotFoundException("Message not found")
    }

    const currentId = ChatService.normalizeUserId(user?.id)
    const senderId = ChatService.normalizeUserId(message.sender?.id)
    if (!currentId || currentId !== senderId) {
      throw new ForbiddenException("Only the sender can delete their message")
    }

    if (message.type === "notification") {
      throw new ForbiddenException("System notifications cannot be deleted")
    }

    const latestInChat = await this.messageRepository.findOne({
      where: { chat: { id: chatId } },
      order: { createdAt: "DESC" },
    })
    const isLastMessage = latestInChat?.id === message.id

    await this.messageRepository.remove(message)

    let lastMessage: string = ""
    let lastUpdate: Date = new Date()

    if (isLastMessage) {
      const lastRemaining = await this.messageRepository.findOne({
        where: { chat: { id: chatId } },
        order: { createdAt: "DESC" },
      })
      const chat = await this.chatRepository.findOne({ where: { id: chatId } })
      if (chat) {
        chat.lastMessage = lastRemaining
          ? lastRemaining.text || (lastRemaining.attachments?.length ? "Attachment" : "Message")
          : ""
        chat.lastUpdate = lastRemaining ? lastRemaining.createdAt : new Date()
        await this.chatRepository.save(chat)
        lastMessage = chat.lastMessage
        lastUpdate = chat.lastUpdate
      }
    } else {
      const chat = await this.chatRepository.findOne({ where: { id: chatId } })
      if (chat) {
        lastMessage = chat.lastMessage ?? ""
        lastUpdate = chat.lastUpdate ?? new Date()
      }
    }

    const chatWithUsers = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ["user1", "user2", "admin"],
    })
    if (chatWithUsers) {
      const userIds = [
        ChatService.normalizeUserId(chatWithUsers.user1?.id),
        ChatService.normalizeUserId(chatWithUsers.user2?.id),
        chatWithUsers.admin ? ChatService.normalizeUserId(chatWithUsers.admin.id) : "",
      ].filter(Boolean) as string[]
      this.chatGateway.notifyMessageDeleted(userIds, chatId, messageId, { lastMessage, lastUpdate })
    }
  }

  async sendMessage(user: User, chatId: string, dto: SendMessageDto, manager?: DataSource) {
    const chatRepo = manager ? manager.getRepository(Chat) : this.chatRepository
    const messageRepo = manager ? manager.getRepository(ChatMessage) : this.messageRepository

    const chat = await chatRepo.findOne({
      where: { id: chatId },
      relations: ["user1", "user2", "admin"],
    })

    if (!chat) {
      throw new NotFoundException("Chat not found")
    }

    const userId = ChatService.normalizeUserId(user?.id)
    const user1Id = ChatService.normalizeUserId(chat.user1?.id)
    const user2Id = ChatService.normalizeUserId(chat.user2?.id)
    const adminId = chat.admin ? ChatService.normalizeUserId(chat.admin.id) : ""

    if (!userId || (userId !== user1Id && userId !== user2Id && userId !== adminId && user.role !== Role.Admin)) {
      throw new ForbiddenException("Access denied")
    }

    const isSupportChat = this.isSupportAgent(chat.user1) || this.isSupportAgent(chat.user2)
    const isAdminSender = user.role === Role.Admin && userId !== user1Id && userId !== user2Id
    const wantsAsSupport = dto.asSupport === true && user.role === Role.Admin && isSupportChat

    let effectiveSender: User = user
    let receiver: User

    if (isSupportChat && (isAdminSender || wantsAsSupport)) {
      const agentSide = this.isSupportAgent(chat.user1) ? chat.user1 : chat.user2
      const userSide = this.isSupportAgent(chat.user1) ? chat.user2 : chat.user1
      effectiveSender = agentSide
      receiver = userSide
    } else {
      receiver = userId === user1Id ? chat.user2 : chat.user1
    }

    const shouldBroadcastToBothParticipants = isAdminSender && chat.isArbitration && !isSupportChat
    const supportHumanAuthorId =
      isSupportChat && this.isSupportAgent(effectiveSender) && user.role === Role.Admin ? userId : null

    const completeMessage = manager
      ? await this.sendMessageWithManager(
          effectiveSender,
          chat,
          receiver,
          shouldBroadcastToBothParticipants,
          dto,
          chatRepo,
          messageRepo,
          supportHumanAuthorId
        )
      : await this.dataSource.transaction(async (txManager) => {
          return this.sendMessageWithManager(
            effectiveSender,
            chat,
            receiver,
            shouldBroadcastToBothParticipants,
            dto,
            txManager.getRepository(Chat),
            txManager.getRepository(ChatMessage),
            supportHumanAuthorId
          )
        })

    const broadcastTargetIds = shouldBroadcastToBothParticipants
      ? [String(chat.user1.id), String(chat.user2.id)]
      : [String(receiver.id)]

    // Use the complete message with relations for notifications
    broadcastTargetIds.forEach((targetId) => {
      this.chatGateway.notifyReceiver(targetId, completeMessage, chat.id)
      this.chatGateway.notifyChatUpdate(targetId, chat.id, {
        lastMessage: chat.lastMessage,
        lastUpdate: chat.lastUpdate,
        countUnread: targetId === String(chat.user1.id) ? chat.countUnread : chat.countUnread2,
      })
    })

    this.chatGateway.notifyReceiver(String(user.id), completeMessage, chat.id)
    this.chatGateway.notifyChatUpdate(user.id, chat.id, {
      lastMessage: chat.lastMessage,
      lastUpdate: chat.lastUpdate,
    })

    if (
      completeMessage &&
      !manager &&
      this.geminiAssistant.isEnabled() &&
      isSupportChat &&
      dto.type !== "notification" &&
      Boolean(dto.text?.trim()) &&
      !this.isSupportAgent(completeMessage.sender)
    ) {
      void this.geminiAssistant.onUserSaysInSupportChat(chat.id, completeMessage.id)
    }

    return completeMessage
  }

  private async sendMessageWithManager(
    user: User,
    chat: Chat,
    receiver: User,
    broadcastToBothParticipants: boolean,
    dto: SendMessageDto,
    chatRepo: Repository<Chat>,
    messageRepo: Repository<ChatMessage>,
    supportHumanAuthorId: string | null = null
  ) {
    const message = messageRepo.create({
      chat,
      sender: user,
      receiver,
      text: dto.text,
      attachments: dto.attachments,
      type: dto.type,
      variant: dto.variant,
      requestId: dto.requestId || null,
      responseId: dto.responseId || null,
      isRead: false,
      supportHumanAuthorId,
    })

    // Save the message
    const savedMessage = await messageRepo.save(message)

    // Update chat with last message info and unread count
    chat.lastMessage = dto.text || (dto.attachments?.length ? "Attachment" : "Message")
    chat.lastUpdate = new Date()

    if (broadcastToBothParticipants) {
      chat.countUnread += 1
      chat.countUnread2 += 1
    } else if (receiver.id === chat.user1.id) {
      chat.countUnread += 1
    } else {
      chat.countUnread2 += 1
    }

    await chatRepo.save(chat)

    // Fetch the complete message with relations (sender and receiver)
    const completeMessage = await messageRepo.findOne({
      where: { id: savedMessage.id },
      relations: ["sender", "receiver"],
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

    const userId = ChatService.normalizeUserId(user?.id)
    const user1Id = ChatService.normalizeUserId(chat.user1?.id)
    const user2Id = ChatService.normalizeUserId(chat.user2?.id)
    if (!userId || (userId !== user1Id && userId !== user2Id)) {
      throw new ForbiddenException("Access denied")
    }

    // Use transaction to ensure data consistency
    await this.dataSource.transaction(async (manager) => {
      if (userId === user1Id) {
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

    const userId = ChatService.normalizeUserId(user?.id)
    const user1Id = ChatService.normalizeUserId(chat.user1?.id)
    const user2Id = ChatService.normalizeUserId(chat.user2?.id)
    if (!userId || (userId !== user1Id && userId !== user2Id)) {
      throw new ForbiddenException("Access denied")
    }

    // Use transaction to ensure data consistency
    const result = await this.dataSource.transaction(async (manager) => {
      const qb = manager
        .createQueryBuilder()
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

      // Send system message to both users (no specific variant in schema for admin join)
      const messageText = "Admin joined the chat"

      // Create message for user1
      const message1 = manager.create(ChatMessage, {
        chat,
        sender: admin,
        receiver: chat.user1,
        type: "notification",
        variant: null,
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
        variant: null,
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

    // Notify both users that admin joined
    const adminData = {
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      avatar: admin.avatar,
    }
    this.chatGateway.notifyAdminJoined(chat.user1.id, chat.id, adminData)
    this.chatGateway.notifyAdminJoined(chat.user2.id, chat.id, adminData)

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
      where: [{ user1: { id: userId } }, { user2: { id: userId } }],
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

  async updateIsActiveOrder(chatId: string, isActiveOrder: boolean): Promise<void> {
    await this.chatRepository.update(chatId, { isActiveOrder })
  }

  /**
   * Notify user about order status changes via WebSocket
   */
  notifyOrderStatusChanged(
    userId: string,
    orderId: string,
    status: string,
    chatId?: string,
    escrowStatus?: string | null
  ): void {
    this.chatGateway.notifyOrderStatusChanged(userId, orderId, status, chatId, escrowStatus)
  }
}
