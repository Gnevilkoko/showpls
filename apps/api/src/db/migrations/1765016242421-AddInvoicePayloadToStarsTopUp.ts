import { MigrationInterface, QueryRunner } from "typeorm"

export class AddInvoicePayloadToStarsTopUp1765016242421 implements MigrationInterface {
  name = "AddInvoicePayloadToStarsTopUp1765016242421"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Сначала добавляем поле как nullable
    await queryRunner.query(`ALTER TABLE "stars_top_up" ADD COLUMN "invoicePayload" character varying(255)`)

    // Заполняем поле для существующих записей (если есть) - генерируем UUID для каждой записи
    await queryRunner.query(`
      UPDATE "stars_top_up" 
      SET "invoicePayload" = uuid_generate_v4()::text 
      WHERE "invoicePayload" IS NULL
    `)

    // Теперь делаем поле NOT NULL
    await queryRunner.query(`ALTER TABLE "stars_top_up" ALTER COLUMN "invoicePayload" SET NOT NULL`)

    // Добавляем уникальный индекс для invoicePayload
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_stars_top_up_invoicePayload" ON "stars_top_up" ("invoicePayload")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем уникальный индекс
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_stars_top_up_invoicePayload"`)

    // Удаляем поле invoicePayload
    await queryRunner.query(`ALTER TABLE "stars_top_up" DROP COLUMN IF EXISTS "invoicePayload"`)
  }
}
