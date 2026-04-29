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

  @ApiProperty({
    enum: [
      "upload",
      "newTask",
      "newOffer",
      "permissionToCancel",
      "taskCompleted",
      "taskCancelled",
      "responseAccepted",
      "responseDeclined",
      "submissionRejected",
    ],
    nullable: true,
  })
  @Column("varchar", { nullable: true })
  variant:
    | "upload"
    | "newTask"
    | "newOffer"
    | "permissionToCancel"
    | "taskCompleted"
    | "taskCancelled"
    | "responseAccepted"
    | "responseDeclined"
    | "submissionRejected"
    | null

  @ApiProperty({ type: "string", nullable: true })
  @Column("text", { nullable: true })
  text: string | null

  @ApiProperty({ type: "string", nullable: true, description: "Связанный requestId (для системных уведомлений по задачам)" })
  @Column("uuid", { nullable: true })
  requestId: string | null

  @ApiProperty({ type: "string", nullable: true, description: "Связанный responseId (для уведомлений об откликах)" })
  @Column("uuid", { nullable: true })
  responseId: string | null

  @ApiProperty({ type: "array", items: { type: "string" } })
  @Column("text", { array: true, default: [] })
  attachments: string[]

  @ApiProperty({ type: "boolean" })
  @Column("boolean", { default: false })
  isRead: boolean

  /**
   * Если сообщение идёт от лица Showpls Agent, но написал живой админ (asSupport),
   * здесь id админа. У ассистента Gemini и автоответов — null.
   */
  @ApiProperty({ type: "string", nullable: true })
  @Column("bigint", { nullable: true })
  supportHumanAuthorId: string | null

  @ApiProperty({ type: "string", format: "date" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
