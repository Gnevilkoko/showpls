import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm"
import { Account } from "./account.entity"
import { Int256Field } from "./int256.field"
import { Currency } from "./currency.entity"

@Index(["currencyId", "accountId"], {
  unique: true
})
@Check(`"amount" >= 0 AND "lockedAmount" >= 0`)
@Entity()
export class Balance {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @ManyToOne(() => Currency, (currency) => currency.balances, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({
    name: "currencyId",
  })
  currency: Relation<Currency>

  @Column("bigint")
  currencyId: string

  @ManyToOne(() => Account, (account) => account, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "accountId",
  })
  account: Relation<Account>

  @Column("bigint")
  accountId: string

  @Int256Field()
  amount: string

  @Int256Field()
  lockedAmount: string

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
