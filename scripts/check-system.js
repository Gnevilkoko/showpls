const axios = require('axios');
const io = require('socket.io-client');

// --- НАСТРОЙКИ ---
const API_URL = 'http://localhost:8080/api';
const SOCKET_URL = 'http://localhost:8080';

// ТВОИ ВЕЧНЫЕ ТОКЕНЫ
const CUST_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc3Nzc3NyIsInJvbGUiOiJub3JtYWwiLCJ0Z0lkIjoiNzc3Nzc3IiwidXNlcm5hbWUiOm51bGwsImZpcnN0TmFtZSI6IkN1c3RvbWVyQnJvIiwibGFzdE5hbWUiOm51bGwsImF2YXRhciI6bnVsbCwibGFuZ3VhZ2VDb2RlIjoicnUiLCJiYW5uZWQiOmZhbHNlLCJsYXN0U2VlbkF0IjoiMjAyNS0xMi0wMVQwNToyODoyNS45MjlaIiwiY3JlYXRlZEF0IjoiMjAyNS0xMi0wMVQwNToyODoyNS45MjlaIiwiaWF0IjoxNzY0NTY2OTE1LCJleHAiOjE3OTYxMDI5MTV9.E8-pI_wfn3_PziQclJF-3h5AhDXuQXaADwqQ0PgCaUoseHp7TaROpSbAFtbDzowmPc1IetyUJK3EsWOO3YDLNfHK6oVcdVGTiqlDxMVr6MOx-dgpZOMGQQs84uuN0YNnVCiqY9yTs3iqk1ljqmEEWeE2Sq7T0vqu4PRJ1DvQ3RXhUpUqRDyds3fdcPTYwh3kNuftsw_zCsw6R7XDusi9hanxYwPQVID0GT7-V3z5pyrAdwuHXgX8-3_4V7GmggKHf2rKt8cMJfxmZ7Hl0-fGaIJXHZCoBmPPNUjyloN3x8rMVLWpP9XKWVjuotsl37x9gom5qELE3QCeGqHIN-DjyDnNpgadN9WZRCCBFKvkC_wXnji8tib2LtCwc3b0Avfea1u-yW7SOAkDUIxjm28sMJ33wqkWGNyqFCpBqNNDf-AIY7GtdI7MruqMDBsdMBUZ3nTKiNgQ4beQ155DeD8wTBrNg8dtQjnJrPqXGTp92v_UpR4q5DsatVlcVV5uyqi7rHAGMA2uh2RUCjzl288h2MYa967l7Day1VcQheLWD8dRCM1UjdUrnh6D1FeL2dSIcwuyxubzrqUrME3GjdERZJEDSNwPEywn-uBY3cb1Wl76p4YGq3lOJBTU_5Ke76suXdkiso_0E2s91C4RhWciCFoBiJ62ttf9i1GBg69ePoU";

const PERF_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg4ODg4OCIsInJvbGUiOiJub3JtYWwiLCJ0Z0lkIjoiODg4ODg4IiwidXNlcm5hbWUiOm51bGwsImZpcnN0TmFtZSI6IlBlcmZvcm1lckJybyIsImxhc3ROYW1lIjpudWxsLCJhdmF0YXIiOm51bGwsImxhbmd1YWdlQ29kZSI6InJ1IiwiYmFubmVkIjpmYWxzZSwibGFzdFNlZW5BdCI6IjIwMjUtMTItMDFUMDU6Mjg6MjUuOTMxWiIsImNyZWF0ZWRBdCI6IjIwMjUtMTItMDFUMDU6Mjg6MjUuOTMxWiIsImlhdCI6MTc2NDU2NjkxNSwiZXhwIjoxNzk2MTAyOTE1fQ.DTPxehhFNNu1MAeagyj-xOcapHCJmFKHhM7lA5Ta5G9Shze0GoZ9pGpXlGfjcKChX8XerzkkPCb3OZ6D16TpZonmAwybEjUJsHxxd2sZq9GnE0fEAumOgSZ_SFqsYMvT3YNfqJKoKdAs_-cdpoye7w-xZv5CG76GP5ZsG4QaFxmlSYPLJdgsdBLUG-C_BL2tQDtGVEYKC-9gbshjSsIFh1PU7Tg_I98lkcg2-Z760TThpN-qPMrq6cH-6d6KmrwcKo50bfDHOjbDmofpIX3LUikzMgNUv6HPeF6SCaEw3gbqYq6SBgvKpqxudaeo-O09jpIGQmvSXshimao2hKRGHjoqM96SS-AbZoiEyaIAGrh5KagN2HAe7WiQ93YOKx-F5x-lTap13mRqCJ528YM-eB0bVko8c-Xw5aDLSefl8r50yh3rH3aaoQnayiKBT9zO-2MJLwG54dighRvuRygToa51iNZHFuYpQVdYv4Y_DiY_W5KdB-qKaUohpEw5Im3iDb6CIB6edJUmoH38kXNIOBtAzX4G9VGlttKktZefDl2K5_eFX6225rUqUcKKj7N3P_nQdpvGafi9AQ78wHlYYSsUKKdkTuu79gMWp6FwrUxovjjriy3JQFViAmwouX9SMnNDPQw8fWIApLb1QQGuRzMwMGNwfvRwwPY7BUOp4TI";

// Утилиты
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (msg, color = '\x1b[0m') => console.log(color + msg + '\x1b[0m');
const colors = { green: '\x1b[32m', red: '\x1b[31m', blue: '\x1b[34m', yellow: '\x1b[33m', magenta: '\x1b[35m' };

async function runTest() {
    log('\n🚀 ЗАПУСК ПОЛНОГО ТЕСТА СИСТЕМЫ (ВКЛЮЧАЯ ЧАТ И GEO ЗАПРОСЫ)...', colors.blue);

    let requestId, responseId, dealId, chatId;
    let eventsReceived = {
        notification: false,
        messageNew: false
    };

    // --- 1. ПОДКЛЮЧАЕМ СОКЕТ ИСПОЛНИТЕЛЯ ---
    log('\n🔌 1. Подключаем веб-сокет Исполнителя...', colors.yellow);
    
    const socket = io(SOCKET_URL, {
        path: '/chat/ws',
        auth: { token: `Bearer ${PERF_TOKEN}` },
        query: { token: PERF_TOKEN },
        transports: ['websocket']
    });

    socket.on('connect', () => {
        log(`✅ Сокет подключен! ID: ${socket.id}`, colors.green);
    });

    socket.on('notification', (data) => {
        log(`🔔 [SOCKET] УВЕДОМЛЕНИЕ: ${data.type}`, colors.blue);
        eventsReceived.notification = true;
    });

socket.on('message:new', (data) => {
        // Берем данные из вложенного объекта .message
        const msg = data.message; 
        log(`💬 [SOCKET] НОВОЕ СООБЩЕНИЕ: "${msg.text}" от ${msg.sender?.firstName || 'Unknown'}`, colors.magenta);
        eventsReceived.messageNew = true;
    });

    await sleep(1000);

    try {
        // --- 2. ЦИКЛ ЗАДАЧИ ---
        log('\n📦 2. Создаем Задачу -> Отклик -> Сделку...', colors.yellow);
        
        // Задача
        const reqRes = await axios.post(`${API_URL}/request/create`, {
            title: `Chat Test ${Date.now()}`,
            description: "Test description",
            price: 500,
            latitude: 55.75,
            longitude: 37.61,
            address: "Moscow",
            expiresAt: new Date(Date.now() + 3600000).toISOString()
        }, { headers: { Authorization: `Bearer ${CUST_TOKEN}` } });
        requestId = reqRes.data.id;
        log(`   ✅ Задача: ${requestId}`, colors.green);

        // Отклик
        const respRes = await axios.post(`${API_URL}/request/${requestId}/respond`, {}, { headers: { Authorization: `Bearer ${PERF_TOKEN}` } });
        responseId = respRes.data.id;
        log(`   ✅ Отклик: ${responseId}`, colors.green);
        
        await sleep(500);

        // Сделка
        const dealRes = await axios.post(`${API_URL}/responses/${responseId}/accept`, { message: "Let's go!" }, {
            headers: { Authorization: `Bearer ${CUST_TOKEN}` }
        });
        dealId = dealRes.data.deal.id;
        log(`   ✅ Сделка: ${dealId}`, colors.green);

        // Проверяем Чат
        if (dealRes.data.deal.chat && dealRes.data.deal.chat.id) {
            chatId = dealRes.data.deal.chat.id;
            log(`   ✅ Чат получен: ${chatId}`, colors.green);
        } else {
            throw new Error("Чат не вернулся в объекте сделки!");
        }

        // --- 3. ТЕСТ ЧАТА ---
        log(`\n💬 3. Тестируем отправку сообщения в чат ${chatId}...`, colors.yellow);
        
        const msgText = `Hello Socket ${Date.now()}`;
        const msgRes = await axios.post(`${API_URL}/chat/${chatId}/message`, {
            text: msgText
        }, { headers: { Authorization: `Bearer ${CUST_TOKEN}` } });

        log(`   ✅ Сообщение отправлено (REST 201 Created)`, colors.green);

        // --- 4. ОЖИДАНИЕ СОБЫТИЙ ---
        log('\n⏳ Ждем события в сокете (5 сек)...', colors.yellow);
        await sleep(5000);

        console.log('\n--- ИТОГИ ---');
        
        if (eventsReceived.notification) {
            log('✅ Уведомления: РАБОТАЮТ', colors.green);
        } else {
            log('❌ Уведомления: НЕ ПРИШЛИ', colors.red);
        }

        if (eventsReceived.messageNew) {
            log('✅ Чат (Real-time): РАБОТАЕТ', colors.green);
        } else {
            log('❌ Чат (Real-time): НЕ ПРИШЛО message:new', colors.red);
        }

        if (eventsReceived.notification && eventsReceived.messageNew) {
            log('\n🏆 ОСНОВНЫЕ ФУНКЦИИ РАБОТАЮТ! Проверяем гео-запросы...', colors.green);
            // Не выходим, продолжаем с гео-тестами
        } else {
            log('\n⚠️ Что-то не долетело в основных функциях.', colors.red);
            process.exit(1);
        }

        // --- 5. ГЕО ТЕСТЫ ---
        log('\n🗺️ 5. Тестируем гео-запросы...', colors.yellow);
        
        try {
            // 5.1 Обновляем геолокацию исполнителя
            log('   5.1 Обновляем геолокацию исполнителя...', colors.blue);
            await axios.post(`${API_URL}/user/update-location`, {
                latitude: 55.76,
                longitude: 37.62
            }, { headers: { Authorization: `Bearer ${PERF_TOKEN}` } });
            log('   ✅ Геолокация исполнителя обновлена', colors.green);
            
            // 5.2 Получаем исполнителей рядом с локацией
            log('   5.2 Получаем исполнителей рядом с локацией...', colors.blue);
            const performersRes = await axios.get(`${API_URL}/user/list-performers`, {
                params: {
                    latitude: 55.75,
                    longitude: 37.61,
                    radiusKm: 10
                },
                headers: { Authorization: `Bearer ${CUST_TOKEN}` }
            });
            log(`   ✅ Найдено исполнителей рядом: ${performersRes.data.length}`, colors.green);
            
            // 5.3 Получаем задачи в границах карты
            log('   5.3 Получаем задачи в границах карты...', colors.blue);
            const mapRes = await axios.get(`${API_URL}/request/map`, {
                params: {
                    north: 55.80,
                    south: 55.70,
                    east: 37.70,
                    west: 37.50
                },
                headers: { Authorization: `Bearer ${CUST_TOKEN}` }
            });
            log(`   ✅ Найдено задач на карте: ${mapRes.data.length}`, colors.green);
            
            // 5.4 Получаем исполнителей рядом с конкретной задачей
            log('   5.4 Получаем исполнителей рядом с задачей...', colors.blue);
            const nearbyPerfRes = await axios.get(`${API_URL}/request/${requestId}/nearby-performers`, {
                params: {
                    radius: 5,
                    limit: 10
                },
                headers: { Authorization: `Bearer ${CUST_TOKEN}` }
            });
            log(`   ✅ Найдено исполнителей рядом с задачей: ${nearbyPerfRes.data.items.length}`, colors.green);
            
            log('\n🗺️ ГЕО-ЗАПРОСЫ: РАБОТАЮТ!', colors.green);
            
        } catch (geoError) {
            log('\n❌ ОШИБКА В ГЕО-ЗАПРОСАХ:', colors.red);
            if (geoError.response) {
                console.log(geoError.response.data);
            } else {
                console.log(geoError.message);
            }
        }

        log('\n🏆 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ!', colors.green);
        process.exit(0);

    } catch (error) {
        log('\n❌ ОШИБКА:', colors.red);
        if (error.response) {
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
        process.exit(1);
    }
}

runTest();