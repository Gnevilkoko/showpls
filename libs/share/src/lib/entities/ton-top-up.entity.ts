import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { Token } from "@share"
import { User } from "./user.entity"

@Entity()
export class TONTopUp {
  @ApiProperty({ type: "string" })
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

    @ApiProperty({ type: "string", nullable: true })
  @Column("varchar", {
    length: 255,
    unique: true,
    nullable: true,
  })
  txid: string | null

    @ApiProperty({ type: "string", nullable: true })
  @Column("decimal", {
    precision: 78,
    scale: 0,
    nullable: true,
  })
  amount: string | null


  @ApiProperty({enum: Token, nullable: true})
  @Column("enum", {
    enum: Token,
    nullable: true,
  })
  token: Token | null

  @Column("boolean")
  paid: boolean

      @ApiProperty({ type: "string"})
  @Generated("increment")
  @Column("bigint", {
    unique: true
  })
  memo: string

  @ManyToOne(() => User, (user) => user.tonTopUps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "userId",
  })
  user: Relation<User>

   @ApiProperty({ type: "string"})
  @Column("bigint")
  userId: string

  @ApiProperty({ type: "string", format: "date" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
