import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { User } from "./user.entity"
import { Request } from "./request.entity"
import { ResponseStatus } from "../response-status.enum"

@Entity()
export class Response {
  @ApiProperty({ type: "string" })
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @ApiProperty({ type: User })
  @ManyToOne(() => User, { nullable: false })
  performer: Relation<User>

  @ApiProperty({ type: "string" })
  @Column("bigint")
  requestId: string

  @ApiProperty({ type: Request })
  @ManyToOne(() => Request, { nullable: false })
  @JoinColumn({ name: "requestId" })
  request: Relation<Request>

  @ApiProperty({ enum: ResponseStatus })
  @Column("enum", {
    enum: ResponseStatus,
    default: ResponseStatus.Pending,
  })
  status: ResponseStatus

  @ApiProperty({ type: "string", format: "date" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
