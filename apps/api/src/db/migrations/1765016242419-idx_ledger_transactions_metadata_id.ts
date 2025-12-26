import { MigrationInterface, QueryRunner } from "typeorm"

export class IdxLedgerTransactionsMetadataId1765016242419 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
           CREATE INDEX IF NOT EXISTS idx_ledger_transactions_metadata_id
      ON transaction ((metadata->>'id'))
      WHERE metadata->>'id' IS NOT NULL;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_ledger_transactions_metadata_id;
    `)
  }
}
