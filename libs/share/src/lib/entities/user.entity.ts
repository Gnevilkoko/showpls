import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm"
import { Role } from "../role.enum"

@Entity()
export class User {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @Column("enum", {
    enum: Role,
  })
  role: Role

  @Column("bigint")
  tgId: string

  @Column("varchar", {
    length: 255,
    nullable: true,
    unique: true,
  })
  username: string | null

  @Column("varchar", {
    length: 255,
  })
  firstName: string

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  lastName: string | null

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  avatar: string | null

  @Column("varchar", {
    length: 2,
  })
  languageCode: string

  @Column("boolean")
  banned: boolean

  @Column({ type: "timestamptz" })
  lastSeenAt: Date

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
