import { ApiProperty } from "@nestjs/swagger"
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm"
import { SpecialSection } from "../special-section.enum"
import { SpecialClaim } from "./special-claim.entity"

export type LocalizedText = {
  ru: string
  en: string
}

export type SpecialActionType = "findTask" | "createTask" | "wallet" | "profile"

@Entity()
export class Special {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ApiProperty({ enum: SpecialSection })
  @Column("enum", {
    enum: SpecialSection,
  })
  section: SpecialSection

  @ApiProperty({ type: Object, additionalProperties: true })
  @Column("jsonb")
  title: LocalizedText

  @ApiProperty({ type: Object, additionalProperties: true })
  @Column("jsonb")
  description: LocalizedText

  @ApiProperty({ type: "array" })
  @Column("jsonb", { default: () => "'[]'::jsonb" })
  steps: LocalizedText[]

  @ApiProperty()
  @Column("varchar", { length: 120 })
  partnerName: string

  @ApiProperty()
  @Column("varchar", { length: 12 })
  partnerShort: string

  @ApiProperty()
  @Column("varchar", { length: 32 })
  partnerColor: string

  @ApiProperty({ nullable: true, type: Object, additionalProperties: true })
  @Column("jsonb", { nullable: true })
  badge: LocalizedText | null

  @ApiProperty()
  @Column("enum", {
    enum: ["findTask", "createTask", "wallet", "profile"],
  })
  actionType: SpecialActionType

  @ApiProperty({ nullable: true, type: Object, additionalProperties: true })
  @Column("jsonb", { nullable: true })
  actionPayload: Record<string, unknown> | null

  @ApiProperty({ type: Object, additionalProperties: true })
  @Column("jsonb")
  actionLabel: LocalizedText

  @ApiProperty()
  @Column("integer")
  rewardAmount: number

  @ManyToOne("Currency", { nullable: false })
  @JoinColumn({ name: "rewardCurrencyId" })
  rewardCurrency: Relation<Record<string, unknown>>

  @ApiProperty()
  @Column("bigint")
  rewardCurrencyId: string

  @ApiProperty()
  @Column("boolean", { default: true })
  isActive: boolean

  @ApiProperty({ nullable: true })
  @Column("timestamp", { nullable: true })
  startsAt: Date | null

  @ApiProperty({ nullable: true })
  @Column("timestamp", { nullable: true })
  endsAt: Date | null

  @ApiProperty()
  @Column("integer", { default: 0 })
  sortOrder: number

  @ApiProperty()
  @Column("integer", { default: 1 })
  claimLimitPerUser: number

  @ApiProperty({ nullable: true, type: Object, additionalProperties: true })
  @Column("jsonb", { nullable: true })
  metadata: Record<string, unknown> | null

  @OneToMany(() => SpecialClaim, (claim) => claim.special)
  claims: Relation<SpecialClaim>[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
