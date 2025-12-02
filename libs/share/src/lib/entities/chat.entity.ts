import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { User } from "./user.entity"

@Entity()
export class Chat {
  @ApiProperty({ type: "string" })
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => User)
  user1: Relation<User>

  @ManyToOne(() => User)
  user2: Relation<User>

  @ManyToOne(() => User, { nullable: true })
  admin: Relation<User> | null

  @ApiProperty({ type: "string", nullable: true })
  @Column("text", { nullable: true })
  lastMessage: string | null

  @ApiProperty({ type: "number" })
  @Column("int", { default: 0 })
  countUnread: number

  @ApiProperty({ type: "number" })
  @Column("int", { default: 0 })
  countUnread2: number

  @ApiProperty({ type: "boolean" })
  @Column("boolean", { default: false })
  isActiveOrder: boolean

  @ApiProperty({ type: "boolean" })
  @Column("boolean", { default: false })
  isArbitration: boolean

  @ApiProperty({ type: "boolean" })
  @Column("boolean", { default: false })
  isFavorite: boolean

  @ApiProperty({ type: "boolean" })
  @Column("boolean", { default: false })
  isFavorite2: boolean

  @ApiProperty({ type: "string", format: "date" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @ApiProperty({ type: "string", format: "date" })
  @UpdateDateColumn({ type: "timestamptz" })
  lastUpdate: Date
}
