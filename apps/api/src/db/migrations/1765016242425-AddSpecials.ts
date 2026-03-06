import { MigrationInterface, QueryRunner } from "typeorm"

export class AddSpecials1765016242425 implements MigrationInterface {
  name = "AddSpecials1765016242425"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."special_section_enum" AS ENUM('missions', 'hotspots')`)
    await queryRunner.query(
      `CREATE TABLE "special" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "section" "public"."special_section_enum" NOT NULL,
        "title" jsonb NOT NULL,
        "description" jsonb NOT NULL,
        "steps" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "partnerName" character varying(120) NOT NULL,
        "partnerShort" character varying(12) NOT NULL,
        "partnerColor" character varying(32) NOT NULL,
        "badge" jsonb,
        "actionType" character varying(32) NOT NULL,
        "actionPayload" jsonb,
        "actionLabel" jsonb NOT NULL,
        "rewardAmount" integer NOT NULL,
        "rewardCurrencyId" bigint NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "startsAt" TIMESTAMP,
        "endsAt" TIMESTAMP,
        "sortOrder" integer NOT NULL DEFAULT '0',
        "claimLimitPerUser" integer NOT NULL DEFAULT '1',
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_special_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_special_reward_currency" FOREIGN KEY ("rewardCurrencyId") REFERENCES "currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )`
    )
    await queryRunner.query(`CREATE INDEX "IDX_special_section_sort" ON "special" ("section", "sortOrder") `)
    await queryRunner.query(`CREATE INDEX "IDX_special_active_window" ON "special" ("isActive", "startsAt", "endsAt") `)

    await queryRunner.query(`CREATE TYPE "public"."special_claim_status_enum" AS ENUM('claimed')`)
    await queryRunner.query(
      `CREATE TABLE "special_claim" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "specialId" uuid NOT NULL,
        "userId" bigint NOT NULL,
        "status" "public"."special_claim_status_enum" NOT NULL DEFAULT 'claimed',
        "claimedAt" TIMESTAMP,
        "rewardTransactionId" bigint,
        "meta" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_special_claim_reward_transaction" UNIQUE ("rewardTransactionId"),
        CONSTRAINT "PK_special_claim_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_special_claim_special" FOREIGN KEY ("specialId") REFERENCES "special"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_special_claim_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_special_claim_transaction" FOREIGN KEY ("rewardTransactionId") REFERENCES "transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )`
    )
    await queryRunner.query(`CREATE INDEX "IDX_special_claim_special_user" ON "special_claim" ("specialId", "userId") `)
    await queryRunner.query(`CREATE INDEX "IDX_special_claim_user_status" ON "special_claim" ("userId", "status") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_special_claim_user_status"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_special_claim_special_user"`)
    await queryRunner.query(`DROP TABLE "special_claim"`)
    await queryRunner.query(`DROP TYPE "public"."special_claim_status_enum"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_special_active_window"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_special_section_sort"`)
    await queryRunner.query(`DROP TABLE "special"`)
    await queryRunner.query(`DROP TYPE "public"."special_section_enum"`)
  }
}
