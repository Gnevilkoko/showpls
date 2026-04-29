-- Синхронизация таблицы user с entity (телефон + nullable tgId для phone auth).
-- Дублирует миграцию AddUserPhoneNullableTgId1765016242426 (идемпотентно).
-- В проде миграции поднимаются при старте API (runtimeIncrementalMigrations).

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" character varying(32);

ALTER TABLE "user" ALTER COLUMN "tgId" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_phone" ON "user" ("phone");
