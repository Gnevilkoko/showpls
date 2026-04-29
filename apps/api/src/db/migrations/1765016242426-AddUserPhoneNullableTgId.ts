import { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Синхронизация с User entity: телефон и nullable tgId (вход по телефону).
 * Идемпотентно для продакшена, где SQL могли применить вручную.
 */
export class AddUserPhoneNullableTgId1765016242426 implements MigrationInterface {
  name = "AddUserPhoneNullableTgId1765016242426"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" character varying(32)`)
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "tgId" DROP NOT NULL`)
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_phone" ON "user" ("phone")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_user_phone"`)
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "phone"`)
  }
}
