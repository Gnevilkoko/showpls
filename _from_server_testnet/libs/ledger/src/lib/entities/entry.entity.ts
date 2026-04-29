import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from "typeorm"
import { Transaction } from "./transaction.entity"
import { Account } from "./account.entity"
import { Currency } from "./currency.entity"
import { Int256Field } from "@ledger/entities/int256.field"

@Entity()
export class Entry {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @Int256Field()
  amount: string

  @ManyToOne(() => Currency, (currency) => currency.entries, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({
    name: "currencyId",
  })
  currency: Relation<Currency>

  @Column("bigint")
  currencyId: string

  @ManyToOne(() => Account, (account) => account.entries, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "accountId",
  })
  account: Relation<Account>

  @Column("bigint")
  accountId: string

  @ManyToOne(() => Transaction, (transaction) => transaction.entries, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "transactionId",
  })
  transaction: Relation<Transaction>

  @Column("bigint")
  transactionId: string

  @Column("jsonb")
  meta: Record<string, any>

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
