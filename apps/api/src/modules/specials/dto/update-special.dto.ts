import { PartialType } from "@nestjs/swagger"
import { CreateSpecialDto } from "./create-special.dto"

export class UpdateSpecialDto extends PartialType(CreateSpecialDto) {}
