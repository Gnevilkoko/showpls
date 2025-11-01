import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm"
import { Entry } from "./entry.entity"
import { AccountOwnerType } from "./account.entity"

export enum TransactionType {
  CreateDeposit = "create-deposit",
  RevertDeposit = "revert-deposit",
  EscrowHold = "escrow-hold",
  EscrowRelease = "escrow-release",
  EscrowRefund = "escrow-refund",
  // Fee = "fee",
  // Adjustment = "adjustment"
}

export enum TransactionStatus  {
  Pending = "pending",
  Completed = "completed",
  Failed = "failed",
  Cancelled = "cancelled"
}


export enum TransactionInitiatorType {
  User = "user"
}


@Check(`("externalId" IS NOT NULL AND "externalType" IS NOT NULL) OR ("externalId" IS NULL AND "externalType" IS NULL)`)
@Index(["externalType", "externalId", "type"], {
  unique: true,
  nullFiltered: true
})
@Entity()
export class Transaction {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @Column("varchar", {
    length: 255,
    nullable: true
  })
  externalType: string | null

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  externalId: string | null

  @Column("enum", {
    enum: TransactionType,
    name: "type"
  })
  type: TransactionType

  @Column("enum", {
    enum: TransactionStatus
  })
  status: TransactionStatus

  @Column("timestamptz", {
    nullable: true
  })
  postedAt: Date | null

  @Column("enum", {
    enum: TransactionInitiatorType
  })
  initiatorType: TransactionInitiatorType

  @Column("bigint", {
    nullable: true
  })
  initiatorId: string | null

  @Index('idx_ledger_transactions_metadata_id', { synchronize: false })
  @Column("jsonb")
  meta: Record<string, any>

  @OneToMany(()=> Entry, (entry) => entry.transaction)
  entries: Relation<Entry>[]

  @Column({type: "timestamptz"})
  updatedAt: Date

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
