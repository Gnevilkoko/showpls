import { MigrationInterface, QueryRunner } from "typeorm"

export class AddDealReviews1765016242424 implements MigrationInterface {
  name = "AddDealReviews1765016242424"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "deal" ADD COLUMN "customerRating" integer`)
    await queryRunner.query(`ALTER TABLE "deal" ADD COLUMN "customerFeedback" text`)
    await queryRunner.query(`ALTER TABLE "deal" ADD COLUMN "reviewedAt" TIMESTAMP`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "deal" DROP COLUMN "reviewedAt"`)
    await queryRunner.query(`ALTER TABLE "deal" DROP COLUMN "customerFeedback"`)
    await queryRunner.query(`ALTER TABLE "deal" DROP COLUMN "customerRating"`)
  }
}
