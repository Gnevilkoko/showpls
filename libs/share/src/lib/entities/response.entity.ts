import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm"
import { User } from "./user.entity"
import { Request } from "./request.entity"
import { ResponseStatus } from "../response-status.enum"
import { Deal } from "./deal.entity"

@Entity()
export class Response {
   @PrimaryGeneratedColumn("uuid")
   id: string

   @ManyToOne(() => Request)
   request: Request

   @ManyToOne(() => User)
   performer: User

   @Column("enum", {
     enum: ["pending", "accepted", "rejected", "cancelled"],
     default: "pending",
   })
   status: ResponseStatus

   @Column("text", { nullable: true })
   message: string | null // Опциональное сообщение при отклике

   @OneToMany(() => Deal, (deal) => deal.response)
   deals: Relation<Deal>[]

   @CreateDateColumn()
   createdAt: Date

   @UpdateDateColumn()
   updatedAt: Date
}
