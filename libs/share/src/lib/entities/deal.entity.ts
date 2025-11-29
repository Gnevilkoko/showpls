import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, type Relation } from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { Request } from "./request.entity"
import { Response } from "./response.entity"
import { DealStatus } from "../deal-status.enum"

@Entity()
export class Deal {
  @ApiProperty({ type: "string" })
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @ApiProperty({ type: Request })
  @ManyToOne(() => Request, { nullable: false })
  request: Relation<Request>

  @ApiProperty({ type: Response })
  @ManyToOne(() => Response, { nullable: false })
  response: Relation<Response>

  @ApiProperty({ enum: DealStatus })
  @Column("enum", {
    enum: DealStatus,
    default: DealStatus.Created,
  })
  status: DealStatus

  @ApiProperty({ type: "string", format: "date" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
