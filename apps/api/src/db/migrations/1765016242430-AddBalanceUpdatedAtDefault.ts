import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddBalanceUpdatedAtDefault1765016242430 implements MigrationInterface {
  name = "AddBalanceUpdatedAtDefault1765016242430"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "balance" ALTER COLUMN "updatedAt" SET DEFAULT now()`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "balance" ALTER COLUMN "updatedAt" DROP DEFAULT`)
  }
}
