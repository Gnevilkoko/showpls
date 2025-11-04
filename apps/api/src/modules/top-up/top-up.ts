import { Token } from "@share"
import { ApiProperty } from "@nestjs/swagger"

export class TopUp {
  @ApiProperty({ enum: Token })
  token: Token

  @ApiProperty({ type: "string", nullable: true })
  amount: string | null

  @ApiProperty({ type: "boolean" })
  paid: boolean

  @ApiProperty({ type: "string", nullable: true })
  txid: string | null

  @ApiProperty({ type: "string" })
  userId: string
  @ApiProperty({ type: "string", format: "date" })
  createdAt: string
}
