import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class TONIgnoredTransaction {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @Column("varchar", {
    length: 255,
    nullable: true,
    unique: true,
  })
  txid: string | null

  @Column("text")
  reason: string

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
