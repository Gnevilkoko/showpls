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
import { Balance } from "./balance.entity"
import { Entry } from "./entry.entity"

@Index(["code", "blockchain"], {
  unique: true,
})
@Check(`scale >= 0 AND scale <= 18`)
@Entity()
export class Currency {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @Column("varchar", {
    length: 10,
  })
  code: string

  @Column("varchar", {
    length: 50
  })
  name: string

  @Column("integer")
  scale: number // decimal places

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  blockchain: string | null

  @OneToMany(() => Balance, (balance) => balance.currency)
  balances: Relation<Balance>[]

  @OneToMany(() => Entry, (entry) => entry.currency)
  entries: Relation<Entry>[]

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
