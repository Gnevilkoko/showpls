import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm"
import { Request } from "./request.entity"
import { Response } from "./response.entity"
import { User } from "./user.entity"
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

   // @ManyToOne(() => Chat)
   // chat: Chat

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

   @CreateDateColumn()
   createdAt: Date

   @UpdateDateColumn()
   updatedAt: Date
}
