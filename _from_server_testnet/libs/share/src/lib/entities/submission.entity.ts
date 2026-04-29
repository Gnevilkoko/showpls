import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, type Relation } from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { Request } from "./request.entity"
import { User } from "./user.entity"
import { FileAttachment } from "./file-attachment.entity"

export enum SubmissionStatus {
  PENDING = "pending",
  SUBMITTED = "submitted",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

@Entity()
export class Submission {
  @ApiProperty({ type: "string" })
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ApiProperty({ type: () => Request })
  @ManyToOne(() => Request, (request) => request.submissions, { nullable: false })
  request: Relation<Request>

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { nullable: false })
  performer: Relation<User>

  @ApiProperty({ type: "object", additionalProperties: true })
  @Column("jsonb", { nullable: true })
  proofMeta: Record<string, any>

  @ApiProperty({ type: "string", format: "date-time" })
  @Column("timestamp")
  serverTs: Date

  @ApiProperty({ enum: SubmissionStatus })
  @Column("enum", { enum: SubmissionStatus, default: SubmissionStatus.PENDING })
  status: SubmissionStatus

  @ApiProperty({ type: () => [FileAttachment] })
  @OneToMany(() => FileAttachment, (attachment) => attachment.submission, { cascade: true })
  attachments: Relation<FileAttachment>[]

  @ApiProperty({ type: "string", format: "date-time" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
