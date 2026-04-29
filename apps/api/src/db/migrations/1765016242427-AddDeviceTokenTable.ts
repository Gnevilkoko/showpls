import { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Таблица push-токенов устройств (DeviceToken entity).
 */
export class AddDeviceTokenTable1765016242427 implements MigrationInterface {
  name = "AddDeviceTokenTable1765016242427"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."device_token_platform_enum" AS ENUM('ios', 'android', 'web');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "device_token" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "pushToken" character varying(512) NOT NULL,
        "platform" "public"."device_token_platform_enum" NOT NULL,
        "deviceId" character varying(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" bigint NOT NULL,
        CONSTRAINT "PK_device_token_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_device_token_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
      );
    `)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_device_token_user_deviceId" ON "device_token" ("userId", "deviceId");
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "device_token"`)
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."device_token_platform_enum"`)
  }
}
