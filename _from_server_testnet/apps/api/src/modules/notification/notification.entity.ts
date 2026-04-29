import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm"
import { User } from "@share/entities/user.entity"

@Entity()
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: Relation<User>

  @Column("text")
  text: string

  @Column("varchar")
  type: string

  @Column("varchar", { nullable: true })
  variant: string

  @Column("jsonb", { nullable: true })
  payload: any

  @Column("boolean", { default: false })
  isRead: boolean

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}