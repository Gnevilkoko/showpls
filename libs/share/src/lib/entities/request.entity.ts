import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm"
import { User } from "./user.entity"
import { Response } from "./response.entity"
import { RequestStatus } from "../request-status.enum"
import { FileAttachment } from "./file-attachment.entity"
import { Deal } from "./deal.entity"
import { Submission } from "./submission.entity"

@Entity()
export class Request {
   @PrimaryGeneratedColumn("uuid")
   id: string

   @ManyToOne(() => User, { nullable: false })
   customer: Relation<User>

   @Column("varchar", { length: 255 })
   title: string

   @Column("text")
   description: string

   @Column("decimal", { precision: 10, scale: 2 })
   price: number

   @Column("geometry", { spatialFeatureType: "Point", srid: 4326 })
   location: any // PostGIS Point

   @Column("enum", {
     enum: ["draft", "published", "accepted", "in_progress", "completed", "cancelled", "arbitration"],
     default: "draft",
   })
   status: RequestStatus

  @OneToMany(() => FileAttachment, (fileAttachment) => fileAttachment.request)
  attachments: Relation<FileAttachment>[]

  @Column("timestamp", { nullable: true })
  expiresAt: Date | null // Время жизни задачи (168 часов для обычных, deadlineAt для urgent)

  @Column("timestamp", { nullable: true })
  deadlineAt: Date | null // Для urgent задач: часы (0-24), минуты (0-50 с шагом 10)

  @Column("timestamp", { nullable: true })
  acceptedAt: Date | null

  @Column("timestamp", { nullable: true })
  completedAt: Date | null

  @Column("timestamp", { nullable: true })
  cancelledAt: Date | null

  @Column("varchar", { length: 500, nullable: true })
  address: string | null // Опциональный адрес для отображения

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any>

  @Column("boolean", { default: false })
  isUrgent: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Response, (response) => response.request)
  responses: Relation<Response>[]

  @OneToMany(() => Deal, (deal) => deal.request)
  deals: Relation<Deal>[]

  @OneToMany(() => Submission, (submission) => submission.request)
  submissions: Relation<Submission>[]
}
