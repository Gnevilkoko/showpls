import { MigrationInterface, QueryRunner } from "typeorm"

export class Phase1Updates1765016242422 implements MigrationInterface {
  name = "Phase1Updates1765016242422"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "about" text`)
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "city" character varying(255)`)
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "isAvailable" boolean NOT NULL DEFAULT false`)

    await queryRunner.query(`CREATE INDEX "IDX_deal_chatId" ON "deal" ("chatId")`)

    await queryRunner.query(
      `CREATE INDEX "IDX_chat_message_chatId_createdAt" ON "chat_message" ("chatId", "createdAt" DESC)`
    )

    await queryRunner.query(
      `CREATE INDEX "IDX_notification_userId_createdAt" ON "notification" ("userId", "createdAt" DESC)`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notification_userId_createdAt"`)
    await queryRunner.query(`DROP INDEX "IDX_chat_message_chatId_createdAt"`)
    await queryRunner.query(`DROP INDEX "IDX_deal_chatId"`)
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isAvailable"`)
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "city"`)
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "about"`)
  }
}
