import { MigrationInterface, QueryRunner } from "typeorm"

export class ChatMessageSupportHumanAuthor1765016242428 implements MigrationInterface {
  name = "ChatMessageSupportHumanAuthor1765016242428"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN "supportHumanAuthorId" bigint`)
    await queryRunner.query(
      `ALTER TABLE "chat_message" ADD CONSTRAINT "FK_chat_message_support_human_author" FOREIGN KEY ("supportHumanAuthorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_chat_message_support_human_author"`)
    await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "supportHumanAuthorId"`)
  }
}
