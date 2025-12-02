import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, type Relation } from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { Chat } from "./chat.entity"
import { User } from "./user.entity"

@Entity()
export class ChatMessage {
  @ApiProperty({ type: "string" })
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => Chat)
  chat: Relation<Chat>

  @ManyToOne(() => User)
  sender: Relation<User>

  @ManyToOne(() => User)
  receiver: Relation<User>

  @ApiProperty({ enum: ["message", "notification"] })
  @Column("enum", { enum: ["message", "notification"], default: "message" })
  type: "message" | "notification"

  @ApiProperty({ type: "string", nullable: true })
  @Column("varchar", { nullable: true })
  variant: string | null

  @ApiProperty({ type: "string", nullable: true })
  @Column("text", { nullable: true })
  text: string | null

  @ApiProperty({ type: "array", items: { type: "string" } })
  @Column("text", { array: true, default: [] })
  attachments: string[]

  @ApiProperty({ type: "boolean" })
  @Column("boolean", { default: false })
  isRead: boolean

  @ApiProperty({ type: "string", format: "date" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
