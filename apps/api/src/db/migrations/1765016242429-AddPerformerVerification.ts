import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddPerformerVerification1765016242429 implements MigrationInterface {
  name = "AddPerformerVerification1765016242429"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "performerVerification" jsonb NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "performerVerification"`)
  }
}
