import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm"
import { EntityManager, Repository, DataSource } from "typeorm"
import { Deal, User } from "@share/entities"
import { Blockchain, ErrorCode, LanguageCode, Role, Token } from "@share"
import { APIException } from "@server/api"
import { DealStatus } from "@share/deal-status.enum"
import { DbHelpers } from "../../db"
import UserExceptions from "./user.exceptions"
import { NotImplemented } from "@share/errors"
import { UserListDto } from "./dto/user-list.dto"
import { UpdateProfileDto } from "./dto/update-profile.dto"
import { SubmitPerformerVerificationDto } from "./dto/submit-performer-verification.dto"
import { PatchPerformerVerificationGeoDto } from "./dto/patch-performer-verification-geo.dto"
import { GeoService } from "../geo/geo.service"
import { paginate } from "nestjs-typeorm-paginate"
import { Ledger } from "@ledger"
import { AccountOwnerType, Entry } from "@ledger/entities"

@Injectable()
export class UserService {
  protected logger = new Logger(UserService.name)

  // 100 STARS in minimal units (1 STAR = 1e6)
  protected static readonly SIGNUP_STARS_ATOMIC = 100n * 10n ** 6n

  constructor(
    @InjectRepository(User) protected repository: Repository<User>,
    @InjectDataSource() protected dataSource: DataSource,
    protected ledger: Ledger,
    protected geoService: GeoService,
  ) {}

  async create({ balances, ...params }: CreateUserParams, manager?: EntityManager | undefined) {
    try {
      const effectiveManager = manager || this.repository.manager
      const insertResult = await (manager || this.repository.manager)
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          ...params,
          lastName: params.lastName || null,
          banned: false,
          lastSeenAt: new Date(),
        })
        .returning("*")
        .execute()

      const user = this.repository.create(insertResult.raw[0] as object)

      try {
        const account = await this.ledger.account.create(
          { ownerId: String(user.id), ownerType: AccountOwnerType.User },
          effectiveManager,
        )
        const starsCurrency = await this.ledger.currency.retrieve({ code: "STARS", blockchain: null })
        if (account && starsCurrency) {
          await this.ledger.balance.create(
            { accountId: account.id, currencyId: starsCurrency.id },
            effectiveManager,
          )

          // Signup bonus: +100 STARS on first user creation (idempotent by externalType+externalId).
          await this.ledger.deposit.create(
            {
              userId: String(user.id),
              amount: UserService.SIGNUP_STARS_ATOMIC,
              currencyId: starsCurrency.id,
              externalType: "signup_bonus",
              externalId: `user-${user.id}`,
            },
            effectiveManager,
          )
        }
      } catch (ledgerErr) {
        this.logger.warn(`Failed to create ledger account for user ${user.id}: ${ledgerErr}`)
      }

      return user
    } catch (e) {
      if (DbHelpers.isUniqueError(e)) {
        throw new UserExceptions.AlreadyCreated()
      }

      throw e
    }
  }

  async retrieve(id: string) {
    return await this.repository.findOneOrFail({
      where: {
        id,
      },
    })
  }

  async getRatingSummary(userId: string): Promise<{ rating: number; reviewsCount: number }> {
    const summary = await this.dataSource
      .getRepository(Deal)
      .createQueryBuilder("deal")
      .select('AVG(deal."customerRating")', "avgRating")
      .addSelect('COUNT(deal."customerRating")', "reviewsCount")
      .where('deal."performerId" = :userId', { userId })
      .andWhere("deal.status = :status", { status: "completed" })
      .andWhere('deal."customerRating" IS NOT NULL')
      .getRawOne<{ avgRating: string | null; reviewsCount: string }>()

    const rawRating = summary?.avgRating ? Number(summary.avgRating) : 5
    const reviewsCount = summary?.reviewsCount ? Number(summary.reviewsCount) : 0

    return {
      rating: reviewsCount === 0 ? 5 : Math.round(rawRating * 10) / 10,
      reviewsCount,
    }
  }

  async retrieveProfile(id: string) {
    const user = await this.retrieve(id)
    const { rating, reviewsCount } = await this.getRatingSummary(id)

    return {
      ...user,
      rating,
      reviewsCount,
    }
  }

  async getReviews(userId: string) {
    const deals = await this.dataSource.getRepository(Deal).find({
      where: {
        performer: { id: userId },
        status: DealStatus.Completed,
      },
      relations: ["customer", "request"],
      order: { reviewedAt: "DESC", updatedAt: "DESC", createdAt: "DESC" },
    })

    return deals
      .filter((deal) => deal.customerRating !== null || deal.customerFeedback)
      .map((deal) => ({
        id: deal.id,
        rating: deal.customerRating,
        feedback: deal.customerFeedback,
        createdAt: (deal.reviewedAt || deal.updatedAt || deal.createdAt).toISOString(),
        reviewer: {
          id: deal.customer.id,
          firstName: deal.customer.firstName,
          lastName: deal.customer.lastName,
          avatar: deal.customer.avatar,
        },
        request: {
          id: deal.request.id,
          title: deal.request.title,
        },
      }))
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.repository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException("User not found")
    }

    const updateData: Partial<Pick<User, "firstName" | "lastName" | "avatar" | "about" | "city">> = {}
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName
    if (dto.avatar !== undefined) updateData.avatar = dto.avatar
    if (dto.about !== undefined) updateData.about = dto.about
    if (dto.city !== undefined) updateData.city = dto.city

    if (Object.keys(updateData).length > 0) {
      await this.repository.update(userId, updateData)
    }

    return this.retrieve(userId)
  }

  async toggleAvailable(userId: string): Promise<{ isAvailable: boolean }> {
    const user = await this.repository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException("User not found")
    }

    const newValue = !user.isAvailable
    if (newValue && user.performerVerification == null) {
      throw new APIException(ErrorCode.BUSINESS_ERROR, "PERFORMER_VERIFICATION_REQUIRED")
    }
    if (newValue) {
      const rows = await this.repository.query(
        `SELECT ("lastKnownLocation" IS NOT NULL) AS "has_loc" FROM "user" WHERE id = $1`,
        [userId],
      )
      if (!rows[0]?.has_loc) {
        throw new APIException(ErrorCode.BUSINESS_ERROR, "PERFORMER_LOCATION_REQUIRED")
      }
    }

    await this.repository.update(userId, { isAvailable: newValue })
    return { isAvailable: newValue }
  }

  async submitPerformerVerification(
    userId: string,
    dto: SubmitPerformerVerificationDto,
  ): Promise<{ performerVerification: object }> {
    const user = await this.repository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException("User not found")
    }

    const verifiedAt = new Date().toISOString()
    const snapshot = {
      verifiedAt,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracyM: dto.accuracyM ?? null,
      os: dto.os,
      osVersion: dto.osVersion,
      deviceModel: dto.deviceModel,
      userAgent: dto.userAgent,
    }

    await this.repository.update(userId, { performerVerification: snapshot })
    await this.geoService.updateUserLocation(userId, dto.latitude, dto.longitude)

    return { performerVerification: snapshot as object }
  }

  async updatePerformerVerificationGeo(
    userId: string,
    dto: PatchPerformerVerificationGeoDto,
  ): Promise<{ performerVerification: object }> {
    const user = await this.repository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException("User not found")
    }
    if (user.performerVerification == null) {
      throw new APIException(ErrorCode.BUSINESS_ERROR, "PERFORMER_VERIFICATION_REQUIRED")
    }

    const prev = user.performerVerification as Record<string, unknown>
    const verifiedAt = new Date().toISOString()
    const snapshot = {
      ...prev,
      verifiedAt,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracyM: dto.accuracyM ?? null,
    }

    await this.repository.update(userId, { performerVerification: snapshot as object })
    await this.geoService.updateUserLocation(userId, dto.latitude, dto.longitude)

    return { performerVerification: snapshot as object }
  }

  async delete() {
    throw new NotImplemented()
  }

  async list({ page, limit, filter, sort }: UserListDto) {
    return paginate(
      this.repository,
      { page, limit },
      {
        where: {
          id: filter.id,
          tgId: filter.tgId,
          role: filter.role,
        },
        order: {
          createdAt: sort.createdAt,
        },
      }
    )
  }

  public async setLanguageCode(id: string, languageCode: LanguageCode) {
    await this.repository.update({ id }, { languageCode })
  }

  async getTransactions(userId: string, query: { limit?: number; offset?: number }) {
    const account = await this.ledger.account.retrieve(
      {
        ownerId: userId,
        ownerType: AccountOwnerType.User,
      },
      undefined
    )

    if (!account) {
      return { items: [], total: 0 }
    }

    const limit = query.limit || 20
    const offset = query.offset || 0

    const [entries, total] = await this.dataSource.getRepository(Entry)
      .createQueryBuilder("entry")
      .leftJoinAndSelect("entry.transaction", "transaction")
      .leftJoinAndSelect("entry.currency", "currency")
      .where("entry.accountId = :accountId", { accountId: account.id })
      .orderBy("entry.createdAt", "DESC")
      .take(limit)
      .skip(offset)
      .getManyAndCount()

    const items = entries.map(entry => ({
      id: entry.id,
      type: entry.transaction.type,
      status: entry.transaction.status,
      amount: entry.amount,
      currency: {
        code: entry.currency.code,
        blockchain: entry.currency.blockchain,
      },
      externalType: entry.transaction.externalType,
      externalId: entry.transaction.externalId,
      createdAt: entry.createdAt.toISOString(),
    }))

    return { items, total }
  }

  async getBalances(userId: string): Promise<Balance[]> {
    const currencies = await this.ledger.currency.list()
    const account = await this.ledger.account.retrieve(
      {
        ownerId: userId,
        ownerType: AccountOwnerType.User,
      },
      undefined
    )

    const aggregated = new Map<string, { balance: bigint; lockedBalance: bigint; token: Token; blockchain: Blockchain | null }>()

    for (const currency of currencies) {
      let balance = "0"
      let lockedBalance = "0"
      if (account) {
        const b = await this.ledger.balance.retrieve({ accountId: account.id, currencyId: currency.id }, undefined)
        if (b) {
          balance = typeof b.amount === "string" ? b.amount : String(b.amount ?? 0)
          lockedBalance = typeof b.lockedAmount === "string" ? b.lockedAmount : String(b.lockedAmount ?? 0)
        }
      }
      const key = `${currency.code}\0${currency.blockchain ?? ""}`
      const existing = aggregated.get(key)
      const addBalance = BigInt(balance)
      const addLocked = BigInt(lockedBalance)
      if (existing) {
        existing.balance += addBalance
        existing.lockedBalance += addLocked
      } else {
        aggregated.set(key, {
          balance: addBalance,
          lockedBalance: addLocked,
          token: currency.code as Token,
          blockchain: currency.blockchain as Blockchain | null,
        })
      }
    }

    return Array.from(aggregated.values()).map(({ token, blockchain, balance, lockedBalance }) => ({
      token,
      blockchain,
      balance: balance.toString(),
      lockedBalance: lockedBalance.toString(),
    }))
  }
}

type Balance = {
  token: Token
  blockchain: Blockchain | null
  balance: string
  lockedBalance: string
}

export type CreateUserParams = {
  role: Role
  tgId: string | null
  username?: string | null
  firstName: string
  lastName?: string | null
  avatar?: string | null
  languageCode: LanguageCode
  balances?: Record<Token, string>
  phone?: string | null
}
