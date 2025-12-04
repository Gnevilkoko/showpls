import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm"
import { Request } from "./request.entity"
import { Chat } from "./chat.entity"
import { User } from "./user.entity"

@Entity()
export class Arbitration {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => Request, { nullable: false })
  request: Relation<Request>

  @ManyToOne(() => Chat, { nullable: false })
  chat: Relation<Chat>

  @ManyToOne(() => User, { nullable: false })
  initiator: Relation<User> // User who created the arbitration (customer or performer)

  @Column("text")
  reason: string // Description of the problem

  @Column("jsonb", { nullable: true })
  attachments: string[] | null // URLs to proof attachments

  @Column("enum", {
    enum: ["pending", "resolved"],
    default: "pending",
  })
  status: "pending" | "resolved"

  @Column("enum", {
    enum: ["approve_cancel", "complete", "reject"],
    nullable: true,
  })
  resolution: "approve_cancel" | "complete" | "reject" | null // Admin's decision

  @Column("text", { nullable: true })
  adminMessage: string | null // Admin's comment on resolution

  @ManyToOne(() => User, { nullable: true })
  resolvedBy: Relation<User> | null // Admin who resolved the arbitration

  @Column("timestamp", { nullable: true })
  resolvedAt: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}