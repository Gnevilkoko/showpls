import { MigrationInterface, QueryRunner } from "typeorm";

export class IdxFileAttachment1701200200000 implements MigrationInterface {
    name = 'IdxFileAttachment1701200200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_file_attachment_hash" ON "file_attachment" ("hash")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_file_attachment_submission_id" ON "file_attachment" ("submissionId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_file_attachment_request_id" ON "file_attachment" ("requestId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_file_attachment_request_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_file_attachment_submission_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_file_attachment_hash"`);
    }
}