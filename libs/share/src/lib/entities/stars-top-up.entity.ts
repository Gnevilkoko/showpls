import { ApiProperty } from "@nestjs/swagger"
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from "typeorm"
import { User } from "./user.entity"

@Entity()
export class StarsTopUp {
  @ApiProperty({ type: "string" })
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  txid: string | null

  @Column("integer")
  amount: number

  @Column("boolean")
  paid: boolean

  @Column("varchar", {
    length: 255,
  })
  link: string

  @Column("boolean", {
    default: false,
  })
  refunded: boolean

  @ManyToOne(() => User, (user) => user.starsTopUps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "userId",
  })
  user: Relation<User>

  @Column("bigint")
  userId: string

  @ApiProperty({ type: "string" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
