import { Column } from "typeorm"


export const Int256Field = ({nullable = false}: {nullable?: boolean} = {}) => Column({
  type: "decimal",
  precision: 78,
  scale: 0,
  nullable
})
