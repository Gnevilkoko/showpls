-- 1. Валюта STARS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "currency" WHERE code = 'STARS' AND blockchain IS NULL) THEN
        INSERT INTO "currency" (code, name, scale, blockchain, "createdAt")
        VALUES ('STARS', 'Telegram Stars', 6, NULL, NOW());
    END IF;
END $$;

-- 2. Заказчик (777777)
INSERT INTO "user" (id, "firstName", "tgId", role, "languageCode", banned, "lastSeenAt", "createdAt", "lastKnownLocation", "locationUpdatedAt")
VALUES (
    777777, 'CustomerBro', 777777, 'normal', 'ru', false, NOW(), NOW(),
    ST_SetSRID(ST_MakePoint(37.615560, 55.752220), 4326), NOW()
)
ON CONFLICT (id) DO UPDATE SET "lastKnownLocation" = ST_SetSRID(ST_MakePoint(37.615560, 55.752220), 4326);

-- 3. Исполнитель (888888)
INSERT INTO "user" (id, "firstName", "tgId", role, "languageCode", banned, "lastSeenAt", "createdAt", "lastKnownLocation", "locationUpdatedAt")
VALUES (
    888888, 'PerformerBro', 888888, 'normal', 'ru', false, NOW(), NOW(),
    ST_SetSRID(ST_MakePoint(37.630000, 55.760000), 4326), NOW()
)
ON CONFLICT (id) DO UPDATE SET "lastKnownLocation" = ST_SetSRID(ST_MakePoint(37.630000, 55.760000), 4326);

-- 3.1. АДМИН (999999) - Добавлен!
INSERT INTO "user" (id, "firstName", "tgId", role, "languageCode", banned, "lastSeenAt", "createdAt")
VALUES (
    999999, 'BigBossAdmin', 999999, 'admin', 'ru', false, NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 4. Счет Заказчика
INSERT INTO "account" (id, purpose, "ownerType", "ownerId", "createdAt")
VALUES (1, 'main', 'user', 777777, NOW())
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN PERFORM setval('account_id_seq', (SELECT COALESCE(MAX(id), 1) FROM account), true); END $$;

-- 5. Баланс Заказчика
DO $$
DECLARE s_cur BIGINT; c_acc BIGINT;
BEGIN
    SELECT id INTO s_cur FROM currency WHERE code = 'STARS' LIMIT 1;
    SELECT id INTO c_acc FROM account WHERE "ownerId" = 777777 LIMIT 1;
    INSERT INTO "balance" ("accountId", "currencyId", "amount", "lockedAmount", "updatedAt", "createdAt")
    VALUES (c_acc, s_cur, '10000000000', '0', NOW(), NOW())
    ON CONFLICT ("accountId", "currencyId") DO UPDATE SET "amount" = '10000000000', "lockedAmount" = '0';
END $$;

-- 6. Задача (IN_PROGRESS, чтобы можно было создать Арбитраж)
INSERT INTO "request" (id, "customerId", title, description, price, location, address, status, "createdAt", metadata)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 777777, 'Arbitration Task', 'Dispute this!', 500, ST_SetSRID(ST_MakePoint(37.61, 55.75), 4326), 'Moscow', 'in_progress', NOW(), '{}')
ON CONFLICT (id) DO NOTHING;

-- 7. Отклик
INSERT INTO "response" (id, "requestId", "performerId", message, status, "createdAt")
VALUES ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 888888, 'I am working', 'accepted', NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. Чат
INSERT INTO "chat" (id, "user1Id", "user2Id", "isActiveOrder", "createdAt")
VALUES ('11111111-1111-1111-1111-111111111111', 777777, 888888, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 9. Сделка (Accepted/In_progress)
INSERT INTO "deal" (id, "requestId", "responseId", "customerId", "performerId", "chatId", status, "escrowStatus", "arbitrationApproved", "createdAt", "updatedAt")
VALUES ('239be2cf-75fd-4a90-bdff-15a901e50233', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 777777, 888888, '11111111-1111-1111-1111-111111111111', 'in_progress', 'locked', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;