import { Check, Entity, PrimaryGeneratedColumn } from "typeorm"

@Check("id = 1")
@Entity()
export class Settings {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string
}
