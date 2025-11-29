import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, type Relation } from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { User } from "./user.entity"
import { Response } from "./response.entity"
import { RequestStatus } from "../request-status.enum"

@Entity()
export class Request {
  @ApiProperty({ type: "string" })
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string

  @ApiProperty({ type: "string" })
  @Column("varchar", { length: 255 })
  title: string

  @ApiProperty({ type: "string" })
  @Column("text")
  description: string

  @ApiProperty({ type: User })
  @ManyToOne(() => User, { nullable: false })
  customer: Relation<User>

  @ApiProperty({ enum: RequestStatus })
  @Column("enum", {
    enum: RequestStatus,
    default: RequestStatus.Open,
  })
  status: RequestStatus

  @ApiProperty({ type: "string" })
  @Column("varchar", { length: 255 })
  price: string

  @ApiProperty({ type: "string" })
  @Column("varchar", { length: 10 })
  currencyId: string

  @ApiProperty({ type: "string" })
  @Column("geometry", { spatialFeatureType: "Point", srid: 4326 })
  location: any // PostGIS Point

  @ApiProperty({ type: "string" })
  @Column("varchar", { length: 500 })
  address: string

  @ApiProperty({ type: "string", format: "date" })
  @Column("timestamptz")
  expiresAt: Date

  @ApiProperty({ type: Response, isArray: true })
  @OneToMany(() => Response, (response) => response.request)
  responses: Relation<Response>[]

  @ApiProperty({ type: "string", format: "date" })
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date
}
