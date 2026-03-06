import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common"
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm"
import { Ledger } from "@ledger"
import { Currency, Transaction, TransactionType } from "@ledger/entities"
import { Special, SpecialClaim, User, type LocalizedText, type SpecialActionType } from "@share/entities"
import { SpecialClaimStatus, SpecialSection, Token } from "@share"
import { DataSource, In, IsNull, Repository } from "typeorm"
import { ListSpecialsDto } from "./dto/list-specials.dto"
import { ConfigService } from "../../config"

type ClaimStatusView = "available" | "claimed" | "unavailable"

type SpecialView = {
  id: string
  section: SpecialSection
  partnerName: string
  partnerShort: string
  partnerColor: string
  title: LocalizedText
  description: LocalizedText
  steps: LocalizedText[]
  badge: LocalizedText | null
  actionType: SpecialActionType
  actionPayload: Record<string, unknown> | null
  actionLabel: LocalizedText
  rewardAmount: number
  rewardCurrencyCode: string
  startsAt: string | null
  endsAt: string | null
  claimLimitPerUser: number
  claimedCount: number
  isClaimed: boolean
  canClaim: boolean
  claimStatus: ClaimStatusView
  metadata: Record<string, unknown> | null
}

@Injectable()
export class SpecialsService implements OnModuleInit {
  private readonly logger = new Logger(SpecialsService.name)

  constructor(
    @InjectRepository(Special) private readonly specialsRepository: Repository<Special>,
    @InjectRepository(SpecialClaim) private readonly specialClaimsRepository: Repository<SpecialClaim>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly ledger: Ledger
  ) {}

  async onModuleInit() {
    if (!ConfigService.isDevelopment() && !ConfigService.isTest()) {
      return
    }

    await this.seedDemoSpecials()
  }

  async list(user: User, query: ListSpecialsDto) {
    const limit = query.limit ?? 20
    const offset = query.offset ?? 0

    const where = {
      isActive: true,
      ...(query.section ? { section: query.section } : {}),
    }

    const [specials, total] = await this.specialsRepository.findAndCount({
      where,
      relations: {
        rewardCurrency: true,
      },
      order: {
        sortOrder: "ASC",
        createdAt: "DESC",
      },
      take: limit,
      skip: offset,
    })

    const claimedCounts = await this.getClaimCounts(user.id, specials.map((special) => special.id))

    return {
      items: specials.map((special) => this.serializeSpecial(special, claimedCounts.get(special.id) ?? 0)),
      total,
      limit,
      offset,
    }
  }

  async findOne(user: User, id: string) {
    const special = await this.specialsRepository.findOne({
      where: {
        id,
        isActive: true,
      },
      relations: {
        rewardCurrency: true,
      },
    })

    if (!special) {
      throw new NotFoundException("Special not found")
    }

    const claimedCounts = await this.getClaimCounts(user.id, [special.id])

    return this.serializeSpecial(special, claimedCounts.get(special.id) ?? 0)
  }

  async claim(user: User, id: string) {
    return this.dataSource.transaction(async (manager) => {
      const special = await manager
        .getRepository(Special)
        .createQueryBuilder("special")
        .setLock("pessimistic_write")
        .where("special.id = :id", { id })
        .andWhere(`special."isActive" = true`)
        .getOne()

      if (!special) {
        throw new NotFoundException("Special not found")
      }

      const rewardCurrency = await manager.getRepository(Currency).findOne({
        where: {
          id: special.rewardCurrencyId,
        },
      })
      const rewardCurrencyCode = rewardCurrency?.code ?? Token.STARS

      const claimedCount = await manager.getRepository(SpecialClaim).count({
        where: {
          specialId: special.id,
          userId: user.id,
          status: SpecialClaimStatus.Claimed,
        },
      })

      const availability = this.getClaimAvailability(special, claimedCount)

      if (!availability.canClaim) {
        throw new BadRequestException(this.getClaimBlockedMessage(availability.claimStatus))
      }

      const claimedAt = new Date()
      const claim = await manager.getRepository(SpecialClaim).save(
        manager.getRepository(SpecialClaim).create({
          specialId: special.id,
          userId: user.id,
          status: SpecialClaimStatus.Claimed,
          claimedAt,
          meta: {
            rewardAmount: special.rewardAmount,
            rewardCurrencyId: special.rewardCurrencyId,
            section: special.section,
          },
        })
      )

      await this.ledger.deposit.create(
        {
          externalType: "special_claim",
          externalId: claim.id,
          amount: BigInt(special.rewardAmount),
          currencyId: special.rewardCurrencyId,
          userId: user.id,
        },
        manager
      )

      const rewardTransaction = await manager.getRepository(Transaction).findOne({
        where: {
          type: TransactionType.CreateDeposit,
          externalType: "special_claim",
          externalId: claim.id,
        },
      })

      if (!rewardTransaction) {
        throw new BadRequestException("Reward transaction was not created")
      }

      claim.rewardTransactionId = rewardTransaction.id
      claim.meta = {
        ...(claim.meta ?? {}),
        rewardCurrencyCode,
        claimSequence: claimedCount + 1,
      }

      await manager.getRepository(SpecialClaim).save(claim)

      return {
        claimId: claim.id,
        rewardTransactionId: rewardTransaction.id,
        special: this.serializeSpecial(special, claimedCount + 1, rewardCurrencyCode),
      }
    })
  }

  private async getClaimCounts(userId: string, specialIds: string[]) {
    if (specialIds.length === 0) {
      return new Map<string, number>()
    }

    const rows = await this.specialClaimsRepository.find({
      where: {
        userId,
        specialId: In(specialIds),
        status: SpecialClaimStatus.Claimed,
      },
      select: {
        specialId: true,
      },
    })

    return rows.reduce((acc, row) => {
      acc.set(row.specialId, (acc.get(row.specialId) ?? 0) + 1)
      return acc
    }, new Map<string, number>())
  }

  private serializeSpecial(special: Special, claimedCount: number, rewardCurrencyCode?: string): SpecialView {
    const availability = this.getClaimAvailability(special, claimedCount)

    return {
      id: special.id,
      section: special.section,
      partnerName: special.partnerName,
      partnerShort: special.partnerShort,
      partnerColor: special.partnerColor,
      title: special.title,
      description: special.description,
      steps: special.steps ?? [],
      badge: special.badge,
      actionType: special.actionType,
      actionPayload: special.actionPayload,
      actionLabel: special.actionLabel,
      rewardAmount: special.rewardAmount,
      rewardCurrencyCode: rewardCurrencyCode ?? this.getRewardCurrencyCode(special),
      startsAt: special.startsAt?.toISOString() ?? null,
      endsAt: special.endsAt?.toISOString() ?? null,
      claimLimitPerUser: special.claimLimitPerUser,
      claimedCount,
      isClaimed: availability.claimStatus === "claimed",
      canClaim: availability.canClaim,
      claimStatus: availability.claimStatus,
      metadata: special.metadata,
    }
  }

  private getClaimAvailability(special: Special, claimedCount: number) {
    const now = new Date()
    const isWithinWindow =
      (!special.startsAt || special.startsAt <= now) &&
      (!special.endsAt || special.endsAt >= now) &&
      special.isActive

    const hasReachedLimit = special.claimLimitPerUser > 0 && claimedCount >= special.claimLimitPerUser

    if (hasReachedLimit) {
      return {
        canClaim: false,
        claimStatus: "claimed" as const,
      }
    }

    if (!isWithinWindow) {
      return {
        canClaim: false,
        claimStatus: "unavailable" as const,
      }
    }

    return {
      canClaim: true,
      claimStatus: "available" as const,
    }
  }

  private getRewardCurrencyCode(special: Special) {
    return (special.rewardCurrency as { code?: string } | null)?.code ?? Token.STARS
  }

  private getClaimBlockedMessage(claimStatus: ClaimStatusView) {
    if (claimStatus === "claimed") {
      return "Special reward already claimed"
    }

    return "Special reward is not available right now"
  }

  private async seedDemoSpecials() {
    const existingCount = await this.specialsRepository.count()
    if (existingCount > 0) {
      return
    }

    const starsCurrency = await this.dataSource.getRepository(Currency).findOne({
      where: {
        code: Token.STARS,
        blockchain: IsNull(),
      },
    })

    if (!starsCurrency) {
      this.logger.warn("Skipped demo specials seed because STARS currency was not found")
      return
    }

    const now = new Date()
    const startsAt = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    await this.specialsRepository.save(
      demoSpecials.map((special, index) =>
        this.specialsRepository.create({
          ...special,
          sortOrder: index,
          rewardCurrencyId: starsCurrency.id,
          startsAt,
          endsAt,
          isActive: true,
        })
      )
    )
  }
}

const demoSpecials: Array<{
  section: SpecialSection
  partnerName: string
  partnerShort: string
  partnerColor: string
  rewardAmount: number
  title: LocalizedText
  description: LocalizedText
  steps: LocalizedText[]
  actionType: SpecialActionType
  actionPayload: Record<string, unknown> | null
  actionLabel: LocalizedText
  badge: LocalizedText | null
  claimLimitPerUser: number
  metadata: Record<string, unknown> | null
}> = [
  {
    section: SpecialSection.Missions,
    partnerName: "Nike",
    partnerShort: "N",
    partnerColor: "#111111",
    rewardAmount: 50,
    title: {
      ru: "Сделай фото с кроссовками Nike",
      en: "Take photo with Nike shoes",
    },
    description: {
      ru: "Сделай четкое фото пары Nike в городской среде и загрузи результат в подходящее задание.",
      en: "Take a clean city-style photo of Nike shoes and upload it to a matching task.",
    },
    steps: [
      {
        ru: "Открой список задач и найди актуальный бриф от партнера.",
        en: "Open the task list and find the active partner brief.",
      },
      {
        ru: "Сними обувь крупно и добавь городской контекст.",
        en: "Shoot the shoes close-up and include the surrounding city context.",
      },
      {
        ru: "Загрузи работу и получи награду после ручного claim.",
        en: "Upload the result and claim your reward manually afterward.",
      },
    ],
    actionType: "findTask",
    actionPayload: { mode: "findTask" },
    actionLabel: {
      ru: "Открыть задачи",
      en: "Open tasks",
    },
    badge: null,
    claimLimitPerUser: 1,
    metadata: null,
  },
  {
    section: SpecialSection.Missions,
    partnerName: "Coca-Cola",
    partnerShort: "C",
    partnerColor: "#E41E26",
    rewardAmount: 100,
    title: {
      ru: "Сними короткое видео с Coca-Cola",
      en: "Film short video drinking Coca-Cola",
    },
    description: {
      ru: "Запиши короткий вертикальный ролик с продуктом в кадре и живой реакцией на камеру.",
      en: "Record a short vertical video with the product visible and a natural on-camera reaction.",
    },
    steps: [
      {
        ru: "Открой задание и проверь требования к длительности и ракурсу.",
        en: "Open the task and review duration and framing requirements.",
      },
      {
        ru: "Сними вертикальное видео при хорошем свете.",
        en: "Record a vertical video in good lighting.",
      },
      {
        ru: "После выполнения открой спецпредложение и забери Stars.",
        en: "After completion, open the special and collect your Stars.",
      },
    ],
    actionType: "findTask",
    actionPayload: { mode: "findTask" },
    actionLabel: {
      ru: "Открыть задачи",
      en: "Open tasks",
    },
    badge: {
      ru: "Популярное",
      en: "Popular",
    },
    claimLimitPerUser: 1,
    metadata: null,
  },
  {
    section: SpecialSection.Missions,
    partnerName: "Showpls",
    partnerShort: "S",
    partnerColor: "#2CD896",
    rewardAmount: 75,
    title: {
      ru: "Поделись миссией Showpls с другом",
      en: "Share Showpls mission with a friend",
    },
    description: {
      ru: "Пригласи друга в мини-приложение и помоги ему найти первую миссию поблизости.",
      en: "Invite a friend to the mini app and help them find the first nearby mission.",
    },
    steps: [
      {
        ru: "Открой профиль и подготовь информацию, которой удобно поделиться.",
        en: "Open your profile and prepare the info you want to share.",
      },
      {
        ru: "Отправь другу приглашение и расскажи, как искать задания.",
        en: "Send an invite and explain how to find tasks.",
      },
      {
        ru: "Затем вернись и вручную забери награду в Specials.",
        en: "Then come back and claim the reward manually in Specials.",
      },
    ],
    actionType: "profile",
    actionPayload: null,
    actionLabel: {
      ru: "Открыть профиль",
      en: "Open profile",
    },
    badge: {
      ru: "Новая",
      en: "New",
    },
    claimLimitPerUser: 1,
    metadata: null,
  },
  {
    section: SpecialSection.Hotspots,
    partnerName: "Nike",
    partnerShort: "N",
    partnerColor: "#111111",
    rewardAmount: 120,
    title: {
      ru: "Покажи ажиотаж у sneaker drop point",
      en: "Capture the rush at a sneaker drop point",
    },
    description: {
      ru: "Найди точку с живой очередью, покажи атмосферу, витрину и поток людей на месте.",
      en: "Find a live queue point and capture the atmosphere, storefront, and crowd flow.",
    },
    steps: [
      {
        ru: "Открой ближайшие задания и выбери срочную точку на карте.",
        en: "Open nearby tasks and select an urgent point on the map.",
      },
      {
        ru: "Сними общую сцену и один-два крупных плана.",
        en: "Capture one wide shot and a couple of close-ups.",
      },
      {
        ru: "После сдачи вернись и забери бонусную награду.",
        en: "After submission, come back and collect the bonus reward.",
      },
    ],
    actionType: "findTask",
    actionPayload: { mode: "findTask" },
    actionLabel: {
      ru: "Смотреть задания",
      en: "Browse tasks",
    },
    badge: {
      ru: "Горит",
      en: "Hot",
    },
    claimLimitPerUser: 1,
    metadata: null,
  },
  {
    section: SpecialSection.Hotspots,
    partnerName: "Coca-Cola",
    partnerShort: "C",
    partnerColor: "#E41E26",
    rewardAmount: 90,
    title: {
      ru: "Покажи активную promo booth в центре",
      en: "Show an active promo booth downtown",
    },
    description: {
      ru: "Сними бренд-зону, промо-материалы и посетителей, которые взаимодействуют с площадкой.",
      en: "Capture the branded booth, promo materials, and visitors interacting with the activation.",
    },
    steps: [
      {
        ru: "Найди задание с живой точкой и проверь, что промо-зона уже открылась.",
        en: "Find a live task and confirm that the promo zone is already open.",
      },
      {
        ru: "Сделай короткий отчет: общий план, брендирование и активность людей.",
        en: "Create a short report: wide shot, branding, and people activity.",
      },
      {
        ru: "После этого открой карточку и получи награду.",
        en: "Then open the card and claim the reward.",
      },
    ],
    actionType: "findTask",
    actionPayload: { mode: "findTask" },
    actionLabel: {
      ru: "Смотреть задания",
      en: "Browse tasks",
    },
    badge: {
      ru: "Срочно",
      en: "Urgent",
    },
    claimLimitPerUser: 1,
    metadata: null,
  },
  {
    section: SpecialSection.Hotspots,
    partnerName: "Showpls",
    partnerShort: "S",
    partnerColor: "#2CD896",
    rewardAmount: 30,
    title: {
      ru: "Попробуй быстрый Stars boost",
      en: "Try a quick Stars boost",
    },
    description: {
      ru: "Пополняй кошелек, чтобы быстрее откликаться на задания и не пропускать горячие точки.",
      en: "Top up your wallet to respond faster and avoid missing urgent hotspots.",
    },
    steps: [
      {
        ru: "Открой кошелек и проверь доступный баланс.",
        en: "Open the wallet and check your available balance.",
      },
      {
        ru: "Держи небольшой запас Stars для быстрых откликов.",
        en: "Keep a small Stars reserve for fast responses.",
      },
      {
        ru: "Вернись сюда и получи бонус за участие.",
        en: "Return here and claim your participation bonus.",
      },
    ],
    actionType: "wallet",
    actionPayload: null,
    actionLabel: {
      ru: "Открыть кошелек",
      en: "Open wallet",
    },
    badge: {
      ru: "Совет",
      en: "Tip",
    },
    claimLimitPerUser: 1,
    metadata: null,
  },
]
