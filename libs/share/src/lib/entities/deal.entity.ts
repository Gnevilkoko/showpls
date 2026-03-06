import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { Request } from "./request.entity"
import { Response } from "./response.entity"
import { User } from "./user.entity"
import { Chat } from "./chat.entity"
import { DealStatus } from "../deal-status.enum"

@Entity()
export class Deal {
   @PrimaryGeneratedColumn("uuid")
   id: string

   @ManyToOne(() => Request)
   request: Request

   @ManyToOne(() => Response)
   response: Response

   @ManyToOne(() => User)
   customer: User

   @ManyToOne(() => User)
   performer: User

   @ManyToOne(() => Chat)
   chat: Chat

   @Column("enum", {
     enum: ["accepted", "in_progress", "completed", "cancelled"],
     default: "accepted",
   })
   status: DealStatus

   @Column("enum", {
     enum: ["locked", "released", "rejected"],
     nullable: true,
   })
   escrowStatus: "locked" | "released" | "rejected" | null

   @Column("boolean", { default: false })
   arbitrationApproved: boolean // Разрешение на отмену от арбитража

   @ApiProperty({ type: "number", nullable: true, minimum: 1, maximum: 5 })
   @Column("int", { nullable: true })
   customerRating: number | null

   @ApiProperty({ type: "string", nullable: true })
   @Column("text", { nullable: true })
   customerFeedback: string | null

   @ApiProperty({ type: "string", nullable: true, format: "date-time" })
   @Column({ type: "timestamp", nullable: true })
   reviewedAt: Date | null

   @CreateDateColumn()
   createdAt: Date

   @UpdateDateColumn()
   updatedAt: Date
}
