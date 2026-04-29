import { MigrationInterface, QueryRunner } from "typeorm"

export class IdxFileAttachment1765016242420 implements MigrationInterface {
  name = "IdxFileAttachment1765016242420"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Индексы для file_attachment
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_file_attachment_hash" ON "file_attachment" ("hash")`)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_file_attachment_submission_id" ON "file_attachment" ("submissionId")`
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_file_attachment_request_id" ON "file_attachment" ("requestId")`
    )

    // GiST индексы для геолокации
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_request_location_gist" ON "request" USING GIST("location")`
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_user_last_known_location_gist" ON "user" USING GIST("lastKnownLocation") WHERE "lastKnownLocation" IS NOT NULL`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Откат GiST индексов
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_last_known_location_gist"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_request_location_gist"`)

    // Откат индексов file_attachment
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_file_attachment_request_id"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_file_attachment_submission_id"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_file_attachment_hash"`)
  }
}
