import { Injectable } from "@nestjs/common"
import { InjectDataSource } from "@nestjs/typeorm"
import { DataSource } from "typeorm"
import { TopUpListDto } from "./dto/top-up-list.dto"
import { createPaginationObject } from "nestjs-typeorm-paginate"

@Injectable()
export class TopUpService {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async list({ page, limit, filter, sort }: TopUpListDto) {
    const offset = page * limit - limit
    function getQuery(onlyCount: boolean) {
      return `
              SELECT ${onlyCount ? "COUNT(*)" : "*"} FROM (
                SELECT 'STARS' as token, txid, amount, paid, "userId", "createdAt" FROM stars_top_up
                UNION ALL
                SELECT token, txid, amount, paid, "userId", "createdAt" FROM ton_top_up
              ) as top_up
              WHERE ($1::varchar IS NULL OR txid = $1::varchar) AND paid = COALESCE($2, paid) AND "userId" = COALESCE($3, "userId")
              ${onlyCount ? "" : 'ORDER BY "createdAt" DESC LIMIT $4 OFFSET $5'}
            `
    }

    const [{ count }] = (await this.dataSource.query(getQuery(true), [
      filter.txid || null,
      typeof filter.paid === "boolean" ? filter.paid : null,
      filter.userId || null,
    ])) as {
      count: string
    }[]
    const items = (await this.dataSource.query(getQuery(false), [
      filter.txid || null,
      typeof filter.paid === "boolean" ? filter.paid : null,
      filter.userId || null,
      limit,
      offset,
    ])) as object[]

    return createPaginationObject({
      currentPage: page,
      limit,
      items,
      totalItems: +count,
    })
  }
}
