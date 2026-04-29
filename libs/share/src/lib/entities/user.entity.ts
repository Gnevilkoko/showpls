import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from "typeorm"
import { Role } from "../role.enum"
import { ApiProperty } from "@nestjs/swagger"
import { LanguageCode } from "../language-code.enum"
import { Token } from "../token.enum"
import { StarsTopUp } from "./stars-top-up.entity"
import { TONTopUp } from "./ton-top-up.entity"
import { Request } from "./request.entity"
import { Response } from "./response.entity"

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

  @ApiProperty({ type: "string", nullable: true })
  @Column("bigint", { nullable: true, unique: true })
  tgId: string | null

  @ApiProperty({ type: "string", nullable: true })
  @Column("varchar", {
    length: 255,
    nullable: true,
    unique: true,
  })
  username: string | null

  @ApiProperty({ type: "string", nullable: true })
  @Column("varchar", { length: 32, nullable: true, unique: true })
  phone: string | null

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

  @ApiProperty({ type: "string", nullable: true })
  @Column("text", { nullable: true })
  about: string | null

  @ApiProperty({ type: "string", nullable: true })
  @Column("varchar", { length: 255, nullable: true })
  city: string | null

  @ApiProperty({ type: "boolean" })
  @Column("boolean", { default: false })
  isAvailable: boolean

  /** Снимок верификации исполнителя: гео + ОС/модель (web/Telegram). */
  @ApiProperty({ type: "object", nullable: true, additionalProperties: true })
  @Column({ type: "jsonb", nullable: true })
  performerVerification: object | null

  @OneToMany(() => StarsTopUp, (topUp) => topUp.user)
  starsTopUps: Relation<StarsTopUp>[]

  @OneToMany(() => TONTopUp, (topUp) => topUp.user)
  tonTopUps: Relation<TONTopUp>[]

  @OneToMany(() => Request, (request) => request.customer)
  requests: Relation<Request>[]

  @OneToMany(() => Response, (response) => response.performer)
  responses: Relation<Response>[]

  @ApiProperty({ type: "string" })
  @Column({ type: "timestamptz" })
  lastSeenAt: Date

  @ApiProperty({ type: "string" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @ApiProperty({
    type: "string",
    nullable: true,
    description: "PostGIS Point geometry for user's last known location"
  })
  @Column("geometry", { spatialFeatureType: "Point", srid: 4326, nullable: true })
  lastKnownLocation: any | null // PostGIS Point

  @ApiProperty({ type: "string", nullable: true })
  @Column({ type: "timestamptz", nullable: true })
  locationUpdatedAt: Date | null
}
