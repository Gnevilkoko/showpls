import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from "typeorm"
import { Role } from "../role.enum"
import { ApiProperty } from "@nestjs/swagger"
import { LanguageCode } from "../language-code.enum"
import { Token } from "../token.enum"
import { StarsTopUp } from "./stars-top-up.entity"
import { TONTopUp } from "./ton-top-up.entity"

@Entity()
export class User {
  @ApiProperty({ type: "string" })
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @ApiProperty({ enum: Role })
  @Column("enum", {
    enum: Role,
  })
  role: Role

  // @Column("jsonb")
  // balances: Record<Token, string>

  @ApiProperty({ type: "string" })
  @Column("bigint")
  tgId: string

  @ApiProperty({ type: "string", nullable: true })
  @Column("varchar", {
    length: 255,
    nullable: true,
    unique: true,
  })
  username: string | null

  @ApiProperty({ type: "string" })
  @Column("varchar", {
    length: 255,
  })
  firstName: string

  @ApiProperty({ type: "string", nullable: true })
  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  lastName: string | null

  @ApiProperty({ type: "string", nullable: true })
  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  avatar: string | null

  @ApiProperty({ enum: LanguageCode })
  @Column("enum", {
    enum: LanguageCode,
  })
  languageCode: LanguageCode

  @ApiProperty({ type: "boolean" })
  @Column("boolean")
  banned: boolean

  @OneToMany(() => StarsTopUp, (topUp) => topUp.user)
  starsTopUps: Relation<StarsTopUp>[]

  @OneToMany(() => TONTopUp, (topUp) => topUp.user)
  tonTopUps: Relation<TONTopUp>[]


  @ApiProperty({ type: "string" })
  @Column({ type: "timestamptz" })
  lastSeenAt: Date

  @ApiProperty({ type: "string" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
