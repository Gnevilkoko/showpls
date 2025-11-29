INSERT INTO "currency" (code, name, scale, blockchain) 
VALUES ('RUB', 'Russian Ruble', 2, NULL)
ON CONFLICT (code, blockchain) DO NOTHING;

-- 2. Заказчик (777777)
INSERT INTO "user" (id, "firstName", "tgId", role, "languageCode", banned, "lastSeenAt", "createdAt") 
VALUES (777777, 'CustomerBro', 777777, 'normal', 'ru', false, NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;

-- 3. Исполнитель (888888)
INSERT INTO "user" (id, "firstName", "tgId", role, "languageCode", banned, "lastSeenAt", "createdAt") 
VALUES (888888, 'PerformerBro', 888888, 'normal', 'ru', false, NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;

-- 4. Создаем Счет
INSERT INTO "account" (id, purpose, "ownerType", "ownerId", "createdAt")
VALUES (1, 'main', 'user', 777777, NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('account_id_seq', (SELECT COALESCE(MAX(id), 1) FROM account));

-- 5. Начисляем Баланс
INSERT INTO "balance" ("accountId", "currencyId", "amount", "lockedAmount", "updatedAt", "createdAt")
VALUES (
    1, 
    (SELECT id FROM currency WHERE code = 'RUB' LIMIT 1), 
    10000000, 
    0, 
    NOW(), 
    NOW()
)
ON CONFLICT ("id") 
DO UPDATE SET "amount" = 10000000;

-- 6. Задача
INSERT INTO "request" (id, title, description, status, price, "currencyId", location, address, "customerId", "createdAt", "expiresAt")
VALUES (1, 'Auto Task', 'Auto Description', 'open', '500', 'RUB', ST_SetSRID(ST_MakePoint(37.61, 55.75), 4326), 'Moscow', 777777, NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('request_id_seq', (SELECT COALESCE(MAX(id), 1) FROM request));

-- 7. Отклик
INSERT INTO "response" (id, "requestId", "performerId", status, "createdAt")
VALUES (1, 1, 888888, 'pending', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('response_id_seq', (SELECT COALESCE(MAX(id), 1) FROM response));