import { MigrationInterface, QueryRunner } from "typeorm"

export class ChatMessageAddRequestResponseIds1765016242423 implements MigrationInterface {
  name = "ChatMessageAddRequestResponseIds1765016242423"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN "requestId" uuid`)
    await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN "responseId" uuid`)
    await queryRunner.query(`CREATE INDEX "IDX_chat_message_requestId" ON "chat_message" ("requestId")`)
    await queryRunner.query(`CREATE INDEX "IDX_chat_message_responseId" ON "chat_message" ("responseId")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_chat_message_responseId"`)
    await queryRunner.query(`DROP INDEX "IDX_chat_message_requestId"`)
    await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "responseId"`)
    await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "requestId"`)
  }
}

