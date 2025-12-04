import { Test, TestingModule } from '@nestjs/testing'
import { ArbitrationService } from '../arbitration.service'
import { Repository, DataSource } from 'typeorm'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Arbitration, Request, Deal, Chat, User } from '@share/entities'
import { ChatService } from '../../chat/chat.service'
import { NotificationService } from '../../notification/notification.service'
import { Ledger } from '@ledger'
import { RequestStatus } from '@share/request-status.enum'
import { DealStatus } from '@share/deal-status.enum'
import { Role } from '@share/role.enum'
import { CreateArbitrationDto } from '../dto/create-arbitration.dto'
import { ResolveArbitrationDto } from '../dto/resolve-arbitration.dto'

describe('ArbitrationService Notifications', () => {
  let service: ArbitrationService
  let arbitrationRepository: Repository<Arbitration>
  let requestRepository: Repository<Request>
  let dealRepository: Repository<Deal>
  let chatRepository: Repository<Chat>
  let chatService: ChatService
  let notificationService: NotificationService
  let ledger: Ledger
  let dataSource: DataSource

  const mockUser = {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    role: Role.User,
  } as User

  const mockAdmin = {
    id: 'admin-1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: Role.Admin,
  } as User

  const mockPerformer = {
    id: 'performer-1',
    firstName: 'Performer',
    lastName: 'User',
    email: 'performer@example.com',
    role: Role.User,
  } as User

  const mockRequest = {
    id: 'request-1',
    title: 'Test Request',
    description: 'Test Description',
    price: 100,
    status: RequestStatus.Accepted,
    customer: mockUser,
    responses: [
      {
        id: 'response-1',
        status: 'accepted',
        performer: mockPerformer,
      },
    ],
    deals: [
      {
        id: 'deal-1',
        status: DealStatus.InProgress,
        performer: mockPerformer,
      },
    ],
  } as Request

  const mockChat = {
    id: 'chat-1',
    user1: mockUser,
    user2: mockPerformer,
    isArbitration: false,
    lastMessage: '',
    lastUpdate: new Date(),
  } as Chat

  beforeEach(async () => {
    const mockDataSource = {
      transaction: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArbitrationService,
        {
          provide: getRepositoryToken(Arbitration),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Request),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Deal),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Chat),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ChatService,
          useValue: {
            getOrCreateChat: jest.fn(),
            sendMessage: jest.fn(),
            notifyOrderStatusChanged: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: Ledger,
          useValue: {
            escrow: {
              release: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get<ArbitrationService>(ArbitrationService)
    arbitrationRepository = module.get<Repository<Arbitration>>(getRepositoryToken(Arbitration))
    requestRepository = module.get<Repository<Request>>(getRepositoryToken(Request))
    dealRepository = module.get<Repository<Deal>>(getRepositoryToken(Deal))
    chatRepository = module.get<Repository<Chat>>(getRepositoryToken(Chat))
    chatService = module.get<ChatService>(ChatService)
    notificationService = module.get<NotificationService>(NotificationService)
    ledger = module.get<Ledger>(Ledger)
    dataSource = module.get<DataSource>(DataSource)
  })

  describe('create arbitration', () => {
    it('should send admin notification when arbitration is created', async () => {
      const dto: CreateArbitrationDto = {
        requestId: 'request-1',
        reason: 'Test reason',
      }

      jest.spyOn(requestRepository, 'findOne').mockResolvedValue(mockRequest)
      jest.spyOn(arbitrationRepository, 'findOne').mockResolvedValue(null)
      jest.spyOn(chatService, 'getOrCreateChat').mockResolvedValue(mockChat)
      
      const mockArbitration = {
        id: 'arbitration-1',
        request: mockRequest,
        chat: mockChat,
        initiator: mockUser,
        reason: dto.reason,
        status: 'pending',
        createdAt: new Date(),
      }

      jest.spyOn(dataSource, 'transaction').mockImplementation(async (callback) => {
        return callback({
          save: jest.fn().mockResolvedValue(mockArbitration),
          findOne: jest.fn().mockResolvedValue(mockChat),
          create: jest.fn().mockReturnValue(mockArbitration),
        })
      })

      await service.create(mockUser, dto)

      // Verify admin notification is sent
      expect(notificationService.send).toHaveBeenCalledWith('admin', 'arbitrationCreated', {
        arbitrationId: 'arbitration-1',
        requestId: 'request-1',
        reason: 'Test reason',
        initiatorId: 'user-1',
        chatId: 'chat-1',
      })

      // Verify chat message is sent
      expect(chatService.sendMessage).toHaveBeenCalledWith(mockUser, 'chat-1', {
        text: 'Arbitration initiated: Test reason',
        type: 'notification',
        variant: 'arbitration',
        attachments: undefined,
      })
    })
  })

  describe('resolve arbitration', () => {
    const mockArbitration = {
      id: 'arbitration-1',
      request: mockRequest,
      chat: mockChat,
      status: 'pending',
      resolvedBy: null,
      resolvedAt: null,
    } as Arbitration

    beforeEach(() => {
      jest.spyOn(arbitrationRepository, 'findOne').mockResolvedValue(mockArbitration)
    })

    it('should send order status change notifications when arbitration is resolved with "complete"', async () => {
      const dto: ResolveArbitrationDto = {
        action: 'complete',
        message: 'Task completed',
      }

      jest.spyOn(dataSource, 'transaction').mockImplementation(async (callback) => {
        return callback({
          save: jest.fn().mockResolvedValue(mockArbitration),
          findOne: jest.fn().mockResolvedValue(mockArbitration),
          createQueryBuilder: jest.fn().mockReturnValue({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 1 }),
          }),
        })
      })

      await service.resolve(mockAdmin, 'arbitration-1', dto)

      // Verify order status change notifications are sent
      expect(chatService.notifyOrderStatusChanged).toHaveBeenCalledWith(
        mockUser.id,
        'request-1',
        RequestStatus.Completed
      )
      expect(chatService.notifyOrderStatusChanged).toHaveBeenCalledWith(
        mockPerformer.id,
        'request-1',
        RequestStatus.Completed
      )
    })

    it('should send order status change notifications when arbitration is resolved with "approve_cancel"', async () => {
      const dto: ResolveArbitrationDto = {
        action: 'approve_cancel',
        message: 'Cancellation approved',
      }

      jest.spyOn(dataSource, 'transaction').mockImplementation(async (callback) => {
        return callback({
          save: jest.fn().mockResolvedValue(mockArbitration),
        })
      })

      await service.resolve(mockAdmin, 'arbitration-1', dto)

      // Verify order status change notification is sent to customer
      expect(chatService.notifyOrderStatusChanged).toHaveBeenCalledWith(
        mockUser.id,
        'request-1',
        RequestStatus.Arbitration
      )
    })

    it('should send order status change notifications when arbitration is resolved with "reject"', async () => {
      const dto: ResolveArbitrationDto = {
        action: 'reject',
        message: 'Arbitration rejected',
      }

      jest.spyOn(dataSource, 'transaction').mockImplementation(async (callback) => {
        return callback({
          save: jest.fn().mockResolvedValue(mockArbitration),
        })
      })

      await service.resolve(mockAdmin, 'arbitration-1', dto)

      // Verify order status change notifications are sent to both parties
      expect(chatService.notifyOrderStatusChanged).toHaveBeenCalledWith(
        mockUser.id,
        'request-1',
        mockRequest.status
      )
      expect(chatService.notifyOrderStatusChanged).toHaveBeenCalledWith(
        mockPerformer.id,
        'request-1',
        mockRequest.status
      )
    })
  })
})