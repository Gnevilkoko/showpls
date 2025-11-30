-- 1. Insert STARS currency (only if it doesn't exist)
INSERT INTO "currency" (code, name, scale, blockchain)
VALUES ('STARS', 'Telegram Stars', 6, NULL)
ON CONFLICT (code, blockchain) DO NOTHING;

-- 2. Заказчик (777777)
INSERT INTO "user" (id, "firstName", "tgId", role, "languageCode", banned, "lastSeenAt", "createdAt")
VALUES (777777, 'CustomerBro', 777777, 'normal', 'ru', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Исполнитель (888888)
INSERT INTO "user" (id, "firstName", "tgId", role, "languageCode", banned, "lastSeenAt", "createdAt")
VALUES (888888, 'PerformerBro', 888888, 'normal', 'ru', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Создаем Счет для заказчика
INSERT INTO "account" (id, purpose, "ownerType", "ownerId", "createdAt")
VALUES (1, 'main', 'user', 777777, NOW())
ON CONFLICT (id) DO NOTHING;

-- Update sequence to avoid conflicts
DO $$
BEGIN
    PERFORM setval('account_id_seq', (SELECT COALESCE(MAX(id), 1) FROM account), true);
END $$;

-- 5. Начисляем Баланс в STARS (для escrow операций)
-- First, ensure we have the currency ID
DO $$
DECLARE
    stars_currency_id BIGINT;
    customer_account_id BIGINT;
BEGIN
    -- Get STARS currency ID (should only be one with blockchain = NULL)
    SELECT id INTO stars_currency_id
    FROM currency
    WHERE code = 'STARS' AND blockchain IS NULL
    ORDER BY id ASC
    LIMIT 1;

    -- Get customer account ID
    SELECT id INTO customer_account_id
    FROM account
    WHERE "ownerId" = 777777 AND "ownerType" = 'user' AND purpose = 'main'
    LIMIT 1;

    -- Insert or update balance
    INSERT INTO "balance" ("accountId", "currencyId", "amount", "lockedAmount", "updatedAt", "createdAt")
    VALUES (
        customer_account_id,
        stars_currency_id,
        '10000000000',
        '0',
        NOW(),
        NOW()
    )
    ON CONFLICT ("accountId", "currencyId")
    DO UPDATE SET
        "amount" = '10000000000',
        "lockedAmount" = '0',
        "updatedAt" = NOW();

    RAISE NOTICE 'Balance created/updated for account % with currency %', customer_account_id, stars_currency_id;
END $$;

-- 6. Задача
INSERT INTO "request" (id, "customerId", title, description, price, location, address, status, "createdAt", metadata)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 777777, 'Auto Task', 'Auto Description', 500, ST_SetSRID(ST_MakePoint(37.61, 55.75), 4326), 'Moscow', 'published', NOW(), '{}')
ON CONFLICT (id) DO NOTHING;

-- 7. Отклик
INSERT INTO "response" (id, "requestId", "performerId", message, status, "createdAt")
VALUES ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 888888, 'I can do this task', 'pending', NOW())
ON CONFLICT (id) DO NOTHING;