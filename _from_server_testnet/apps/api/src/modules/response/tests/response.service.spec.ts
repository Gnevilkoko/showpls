import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common"
import { ResponseService } from "../response.service"
import { ResponseStatus } from "@share/response-status.enum"

describe("ResponseService.withdrawResponse", () => {
  const createService = (overrides?: {
    findOne?: jest.Mock
    transaction?: jest.Mock
    notify?: jest.Mock
    getOrCreateChat?: jest.Mock
    sendMessage?: jest.Mock
    sendNotification?: jest.Mock
  }) => {
    const responseRepository = {
      findOne: overrides?.findOne ?? jest.fn(),
    } as any

    const dataSource = {
      transaction: overrides?.transaction ?? jest.fn(async (cb: any) => cb({ update: jest.fn() })),
    } as any

    const chatGateway = {
      notifyProposalStatusChanged: overrides?.notify ?? jest.fn(),
    } as any

    const chatService = {
      getOrCreateChat: overrides?.getOrCreateChat ?? jest.fn(),
      sendMessage: overrides?.sendMessage ?? jest.fn(),
    } as any

    const notificationService = {
      send: overrides?.sendNotification ?? jest.fn().mockResolvedValue(undefined),
    } as any

    const service = new ResponseService(
      responseRepository,
      {} as any,
      {} as any,
      dataSource,
      chatService,
      chatGateway,
      notificationService
    )

    return { service, responseRepository, dataSource, chatService, chatGateway, notificationService }
  }

  it("throws NotFoundException when response does not exist", async () => {
    const { service } = createService({
      findOne: jest.fn().mockResolvedValue(null),
    })

    await expect(service.withdrawResponse({ id: "1" } as any, "response-1")).rejects.toBeInstanceOf(NotFoundException)
  })

  it("throws BadRequestException when response is not pending", async () => {
    const { service } = createService({
      findOne: jest.fn().mockResolvedValue({
        id: "response-1",
        status: ResponseStatus.Accepted,
        performer: { id: "2" },
        request: { id: "request-1", customer: { id: "1" }, title: "Task" },
      }),
    })

    await expect(service.withdrawResponse({ id: "2" } as any, "response-1")).rejects.toBeInstanceOf(BadRequestException)
  })

  it("throws ForbiddenException when user is not response performer", async () => {
    const { service } = createService({
      findOne: jest.fn().mockResolvedValue({
        id: "response-1",
        status: ResponseStatus.Pending,
        performer: { id: "2" },
        request: { id: "request-1", customer: { id: "1" }, title: "Task" },
      }),
    })

    await expect(service.withdrawResponse({ id: "3" } as any, "response-1")).rejects.toBeInstanceOf(ForbiddenException)
  })

  it("updates status and returns quickly without waiting side effects", async () => {
    const notify = jest.fn()
    const unresolved = new Promise(() => {
      // intentionally unresolved
    })
    const getOrCreateChat = jest.fn().mockReturnValue(unresolved)
    const sendNotification = jest.fn().mockRejectedValue(new Error("queue down"))
    const update = jest.fn().mockResolvedValue(undefined)

    const { service, dataSource } = createService({
      findOne: jest.fn().mockResolvedValue({
        id: "response-1",
        status: ResponseStatus.Pending,
        performer: { id: "2" },
        request: { id: "request-1", customer: { id: "1" }, title: "Task" },
      }),
      transaction: jest.fn(async (cb: any) => cb({ update })),
      notify,
      getOrCreateChat,
      sendNotification,
    })

    const result = await service.withdrawResponse({ id: "2" } as any, "response-1")

    expect(dataSource.transaction).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith(expect.anything(), { id: "response-1" }, { status: ResponseStatus.Cancelled })
    expect(notify).toHaveBeenCalledWith("1", "response-1", ResponseStatus.Cancelled)
    expect(result).toEqual({
      response: { id: "response-1", status: ResponseStatus.Cancelled },
    })
  })
})

