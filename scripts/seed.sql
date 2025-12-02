-- 1. Валюта STARS
INSERT INTO "currency" (code, name, scale, blockchain)
VALUES ('STARS', 'Telegram Stars', 6, NULL)
ON CONFLICT (code, blockchain) DO NOTHING;

-- 2. Заказчик (777777) - Ставим в центр Москвы
INSERT INTO "user" (id, "firstName", "tgId", role, "languageCode", banned, "lastSeenAt", "createdAt", "lastKnownLocation", "locationUpdatedAt")
VALUES (
    777777, 
    'CustomerBro', 
    777777, 
    'normal', 
    'ru', 
    false, 
    NOW(), 
    NOW(),
    ST_SetSRID(ST_MakePoint(37.615560, 55.752220), 4326), -- Кремль
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    "lastKnownLocation" = ST_SetSRID(ST_MakePoint(37.615560, 55.752220), 4326),
    "locationUpdatedAt" = NOW();

-- 3. Исполнитель (888888) - Ставим в 1.5 км от центра (чтобы попасть в радиус)
INSERT INTO "user" (id, "firstName", "tgId", role, "languageCode", banned, "lastSeenAt", "createdAt", "lastKnownLocation", "locationUpdatedAt")
VALUES (
    888888, 
    'PerformerBro', 
    888888, 
    'normal', 
    'ru', 
    false, 
    NOW(), 
    NOW(),
    ST_SetSRID(ST_MakePoint(37.630000, 55.760000), 4326), -- Чуть в стороне (Чистые пруды)
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    "lastKnownLocation" = ST_SetSRID(ST_MakePoint(37.630000, 55.760000), 4326),
    "locationUpdatedAt" = NOW();

-- 4. Создаем Счет для заказчика
INSERT INTO "account" (id, purpose, "ownerType", "ownerId", "createdAt")
VALUES (1, 'main', 'user', 777777, NOW())
ON CONFLICT (id) DO NOTHING;

-- Update sequence to avoid conflicts
DO $$
BEGIN
    PERFORM setval('account_id_seq', (SELECT COALESCE(MAX(id), 1) FROM account), true);
END $$;

-- 5. Начисляем Баланс в STARS
DO $$
DECLARE
    stars_currency_id BIGINT;
    customer_account_id BIGINT;
BEGIN
    SELECT id INTO stars_currency_id FROM currency WHERE code = 'STARS' AND blockchain IS NULL LIMIT 1;
    SELECT id INTO customer_account_id FROM account WHERE "ownerId" = 777777 AND "ownerType" = 'user' AND purpose = 'main' LIMIT 1;

    INSERT INTO "balance" ("accountId", "currencyId", "amount", "lockedAmount", "updatedAt", "createdAt")
    VALUES (customer_account_id, stars_currency_id, '10000000000', '0', NOW(), NOW())
    ON CONFLICT ("accountId", "currencyId")
    DO UPDATE SET "amount" = '10000000000', "lockedAmount" = '0', "updatedAt" = NOW();
END $$;

-- 6. Задача (Тоже в Москве)
INSERT INTO "request" (id, "customerId", title, description, price, location, address, status, "createdAt", metadata)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    777777, 
    'Auto Task', 
    'Auto Description', 
    500, 
    ST_SetSRID(ST_MakePoint(37.615560, 55.752220), 4326), 
    'Moscow', 
    'published', 
    NOW(), 
    '{}'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Отклик
INSERT INTO "response" (id, "requestId", "performerId", message, status, "createdAt")
VALUES ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 888888, 'I can do this task', 'pending', NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. Создание чата
INSERT INTO "chat" (id, "user1Id", "user2Id", "isActiveOrder", "createdAt")
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    777777, 
    888888, 
    true, 
    NOW()
)
ON CONFLICT (id) DO NOTHING;