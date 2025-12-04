import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, type Relation } from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { Request } from "./request.entity"
import { Submission } from "./submission.entity"

@Entity()
export class FileAttachment {
  @ApiProperty({ type: "string" })
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ApiProperty({ type: () => Request })
  @ManyToOne(() => Request, (request) => request.attachments, { nullable: true })
  request: Relation<Request> | null

  @ApiProperty({ type: () => Submission })
  @ManyToOne(() => Submission, (submission) => submission.attachments, { nullable: true })
  submission: Relation<Submission> | null

  @ApiProperty({ type: "string" })
  @Column("varchar", { length: 2048 })
  url: string

  @ApiProperty({ type: "string" })
  @Column("varchar", { length: 64 })
  hash: string

  @ApiProperty({ type: "string", format: "date-time" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
