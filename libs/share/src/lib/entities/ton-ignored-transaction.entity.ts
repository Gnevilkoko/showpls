import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class TONIgnoredTransaction {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @Column("varchar", {
    length: 255,
    unique: true,
  })
  txid: string

  @Column("text")
  reason: string

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
