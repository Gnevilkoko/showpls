import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, type Relation } from "typeorm"
import { Balance } from "./balance.entity"
import { Entry } from "./entry.entity"

export enum AccountOwnerType {
  User = "user",
  Platform = "platform",
  Escrow = "escrow",
  External = "external",
  // Dust = "dust"
}

export enum AccountPurpose {
  Main = "main",
}

@Index(["purpose", "ownerType", "ownerId"], {
  unique: true
})
@Entity()
export class Account {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @Column("enum", {
    enum: AccountPurpose,
  })
  purpose: AccountPurpose

  @Column("enum", {
    enum: AccountOwnerType,
  })
  ownerType: AccountOwnerType

  @Column("bigint", {
    nullable: true,
  })
  ownerId: string | null

  @OneToMany(() => Balance, (balance) => balance.account)
  balances: Relation<Balance>[]

  @OneToMany(() => Entry, (entry) => entry.account)
  entries: Relation<Entry>[]

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
