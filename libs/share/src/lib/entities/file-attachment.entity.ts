import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, type Relation } from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { Request } from "./request.entity"

@Entity()
export class FileAttachment {
  @ApiProperty({ type: "string" })
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @ApiProperty({ type: Request })
  @ManyToOne(() => Request, { nullable: false })
  request: Relation<Request>

  @ApiProperty({ type: "string" })
  @Column("varchar", { length: 2048 })
  url: string

  @ApiProperty({ type: "string" })
  @Column("varchar", { length: 64 })
  hash: string

  @ApiProperty({ type: "string", format: "date" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
