import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn, Unique } from "typeorm"
import { User } from "./user.entity"

export enum DevicePlatform {
  IOS = "ios",
  ANDROID = "android",
  WEB = "web",
}

@Entity()
@Unique(["user", "deviceId"])
export class DeviceToken {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: Relation<User>

  @Column("varchar", { length: 512 })
  pushToken: string

  @Column("enum", { enum: DevicePlatform })
  platform: DevicePlatform

  @Column("varchar", { length: 255, nullable: true })
  deviceId: string | null

  @Column("boolean", { default: true })
  isActive: boolean

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date
}
