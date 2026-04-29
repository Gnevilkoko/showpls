import { ApiProperty } from "@nestjs/swagger"
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn, type Relation } from "typeorm"
import { SpecialClaimStatus } from "../special-claim-status.enum"
import { Special } from "./special.entity"
import { User } from "./user.entity"

@Entity()
@Unique("special_claim_unique_transaction_id", ["rewardTransactionId"])
export class SpecialClaim {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => Special, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "specialId" })
  special: Relation<Special>

  @ApiProperty()
  @Column("uuid")
  specialId: string

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: Relation<User>

  @ApiProperty()
  @Column("bigint")
  userId: string

  @ApiProperty({ enum: SpecialClaimStatus })
  @Column("enum", {
    enum: SpecialClaimStatus,
    default: SpecialClaimStatus.Claimed,
  })
  status: SpecialClaimStatus

  @ApiProperty({ nullable: true })
  @Column("timestamp", { nullable: true })
  claimedAt: Date | null

  @ManyToOne("Transaction", { nullable: true })
  @JoinColumn({ name: "rewardTransactionId" })
  rewardTransaction: Relation<Record<string, unknown>> | null

  @ApiProperty({ nullable: true })
  @Column("bigint", { nullable: true })
  rewardTransactionId: string | null

  @ApiProperty({ nullable: true, type: Object, additionalProperties: true })
  @Column("jsonb", { nullable: true })
  meta: Record<string, unknown> | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
