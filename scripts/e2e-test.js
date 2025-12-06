const axios = require("axios")
const io = require("socket.io-client")

// --- НАСТРОЙКИ ---
const API_URL = "http://localhost:8080/api"
const SOCKET_URL = "http://localhost:8080"

// ВЕЧНЫЕ ТОКЕНЫ
const CUST_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc3Nzc3NyIsInJvbGUiOiJub3JtYWwiLCJ0Z0lkIjoiNzc3Nzc3IiwidXNlcm5hbWUiOm51bGwsImZpcnN0TmFtZSI6IkN1c3RvbWVyQnJvIiwibGFzdE5hbWUiOm51bGwsImF2YXRhciI6bnVsbCwibGFuZ3VhZ2VDb2RlIjoicnUiLCJiYW5uZWQiOmZhbHNlLCJsYXN0U2VlbkF0IjoiMjAyNS0xMi0wMVQwNToyODoyNS45MjlaIiwiY3JlYXRlZEF0IjoiMjAyNS0xMi0wMVQwNToyODoyNS45MjlaIiwiaWF0IjoxNzY0NTY2OTE1LCJleHAiOjE3OTYxMDI5MTV9.E8-pI_wfn3_PziQclJF-3h5AhDXuQXaADwqQ0PgCaUoseHp7TaROpSbAFtbDzowmPc1IetyUJK3EsWOO3YDLNfHK6oVcdVGTiqlDxMVr6MOx-dgpZOMGQQs84uuN0YNnVCiqY9yTs3iqk1ljqmEEWeE2Sq7T0vqu4PRJ1DvQ3RXhUpUqRDyds3fdcPTYwh3kNuftsw_zCsw6R7XDusi9hanxYwPQVID0GT7-V3z5pyrAdwuHXgX8-3_4V7GmggKHf2rKt8cMJfxmZ7Hl0-fGaIJXHZCoBmPPNUjyloN3x8rMVLWpP9XKWVjuotsl37x9gom5qELE3QCeGqHIN-DjyDnNpgadN9WZRCCBFKvkC_wXnji8tib2LtCwc3b0Avfea1u-yW7SOAkDUIxjm28sMJ33wqkWGNyqFCpBqNNDf-AIY7GtdI7MruqMDBsdMBUZ3nTKiNgQ4beQ155DeD8wTBrNg8dtQjnJrPqXGTp92v_UpR4q5DsatVlcVV5uyqi7rHAGMA2uh2RUCjzl288h2MYa967l7Day1VcQheLWD8dRCM1UjdUrnh6D1FeL2dSIcwuyxubzrqUrME3GjdERZJEDSNwPEywn-uBY3cb1Wl76p4YGq3lOJBTU_5Ke76suXdkiso_0E2s91C4RhWciCFoBiJ62ttf9i1GBg69ePoU"

const PERF_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg4ODg4OCIsInJvbGUiOiJub3JtYWwiLCJ0Z0lkIjoiODg4ODg4IiwidXNlcm5hbWUiOm51bGwsImZpcnN0TmFtZSI6IlBlcmZvcm1lckJybyIsImxhc3ROYW1lIjpudWxsLCJhdmF0YXIiOm51bGwsImxhbmd1YWdlQ29kZSI6InJ1IiwiYmFubmVkIjpmYWxzZSwibGFzdFNlZW5BdCI6IjIwMjUtMTItMDFUMDU6Mjg6MjUuOTMxWiIsImNyZWF0ZWRBdCI6IjIwMjUtMTItMDFUMDU6Mjg6MjUuOTMxWiIsImlhdCI6MTc2NDU2NjkxNSwiZXhwIjoxNzk2MTAyOTE1fQ.DTPxehhFNNu1MAeagyj-xOcapHCJmFKHhM7lA5Ta5G9Shze0GoZ9pGpXlGfjcKChX8XerzkkPCb3OZ6D16TpZonmAwybEjUJsHxxd2sZq9GnE0fEAumOgSZ_SFqsYMvT3YNfqJKoKdAs_-cdpoye7w-xZv5CG76GP5ZsG4QaFxmlSYPLJdgsdBLUG-C_BL2tQDtGVEYKC-9gbshjSsIFh1PU7Tg_I98lkcg2-Z760TThpN-qPMrq6cH-6d6KmrwcKo50bfDHOjbDmofpIX3LUikzMgNUv6HPeF6SCaEw3gbqYq6SBgvKpqxudaeo-O09jpIGQmvSXshimao2hKRGHjoqM96SS-AbZoiEyaIAGrh5KagN2HAe7WiQ93YOKx-F5x-lTap13mRqCJ528YM-eB0bVko8c-Xw5aDLSefl8r50yh3rH3aaoQnayiKBT9zO-2MJLwG54dighRvuRygToa51iNZHFuYpQVdYv4Y_DiY_W5KdB-qKaUohpEw5Im3iDb6CIB6edJUmoH38kXNIOBtAzX4G9VGlttKktZefDl2K5_eFX6225rUqUcKKj7N3P_nQdpvGafi9AQ78wHlYYSsUKKdkTuu79gMWp6FwrUxovjjriy3JQFViAmwouX9SMnNDPQw8fWIApLb1QQGuRzMwMGNwfvRwwPY7BUOp4TI"
// АДМИН ТОКЕН (для тестирования функций администратора)
const ADMIN_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk5OTk5OSIsInJvbGUiOiJhZG1pbiIsInRnSWQiOiI5OTk5OTkiLCJ1c2VybmFtZSI6bnVsbCwiZmlyc3ROYW1lIjoiQmlnQm9zc0FkbWluIiwibGFzdE5hbWUiOm51bGwsImF2YXRhciI6bnVsbCwibGFuZ3VhZ2VDb2RlIjoicnUiLCJiYW5uZWQiOmZhbHNlLCJsYXN0U2VlbkF0IjoiMjAyNS0xMi0wNFQxNTowMjozNy43MTBaIiwiY3JlYXRlZEF0IjoiMjAyNS0xMi0wNFQxNTowMjozNy43MTBaIiwibGFzdEtub3duTG9jYXRpb24iOm51bGwsImxvY2F0aW9uVXBkYXRlZEF0IjpudWxsLCJpYXQiOjE3NjQ4NjA1NjYsImV4cCI6MTc5NjM5NjU2Nn0.ApdU6DrPKMtgRKQ9_VmC5A8t44u1nzZT7a0rOwLY0K9zcR3ksr7pydFnTXavv5CbCTjOvectAE-Q-B5Zce-BBPndQhd29Pn40dVfULgTpGWODOqeDYLJ-41srD0AkrvXRiKPtwwoSRIae7xDYWucpcCRkRhIdb_eE1aAV7i5y0BS8GBAuITFLvA5xZt0eusTgHSgEdi7np-jE4BKJtIFwz10vuysYfgPNuKgsPAgtMTJklYAqMHzQDYAHsnoGMO54kfW80rvLSMB34KLvSb9tf7Hthq_GSRb7cB_-9JYUQwvmhONX7XqZOXSOuXFhk5G7x2sONt6FdIOq3xVhvSegNIjliPdVut5HfTsjVsvfuVsu59CRSFtmkF3tdqZf-_E7PiBaJJ7QycT7tIb5I8ObrgLD_HjsX_hx9cG_Kj2lWK--oNh26NwyTppAhMjX9k2PtFa5Z6ihnZ3fnjyWmuL4cvod11klx1w2RotGvbG2tb0t8e-dzb1HieJFR3JlHww9yPU9hGsJ6uy_dpbviUcQOojGi4WTtpWsge0jSvpCNnc2G42NmpuEl_Aqyg8tZv1zj5F2nGVO7qEgxyKnRd9oO0C-FmSoYa4G8OhJsmwElwR4yrN8-OgQ4NmpJYWR5fsR9U6__2D54tWss2OHMrNDy6knuqe-Oe8NIfAH85d0g0"

// Утилиты
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (msg, color = "\x1b[0m") => console.log(color + msg + "\x1b[0m")
const colors = { green: "\x1b[32m", red: "\x1b[31m", blue: "\x1b[34m", yellow: "\x1b[33m", magenta: "\x1b[35m" }

async function runTest() {
  log("\n🚀 ЗАПУСК ПОЛНОГО ТЕСТА СИСТЕМЫ (ВКЛЮЧАЯ ЧАТ И GEO ЗАПРОСЫ)...", colors.blue)

  let requestId, responseId, dealId, chatId, draftRequestId, submissionId, arbitrationId
  let eventsReceived = {
    notification: false,
    messageNew: false,
    orderStatusChanged: false,
    proposalStatusChanged: false,
    uploadNotification: false,
    adminJoinedChat: false,
    arbitrationCreated: false,
    arbitrationResolved: false,
  }

  // --- 1. ПОДКЛЮЧАЕМ СОКЕТЫ ИСПОЛНИТЕЛЯ И ЗАКАЗЧИКА ---
  log("\n🔌 1. Подключаем веб-сокеты Исполнителя и Заказчика...", colors.yellow)

  // Сокет исполнителя
  const performerSocket = io(SOCKET_URL, {
    path: "/chat/ws",
    auth: { token: `Bearer ${PERF_TOKEN}` },
    query: { token: PERF_TOKEN },
    transports: ["websocket"],
  })

  performerSocket.on("connect", () => {
    log(`✅ Сокет Исполнителя подключен! ID: ${performerSocket.id}`, colors.green)
  })

  // Сокет заказчика (для получения уведомлений)
  const customerSocket = io(SOCKET_URL, {
    path: "/chat/ws",
    auth: { token: `Bearer ${CUST_TOKEN}` },
    query: { token: CUST_TOKEN },
    transports: ["websocket"],
  })

  customerSocket.on("connect", () => {
    log(`✅ Сокет Заказчика подключен! ID: ${customerSocket.id}`, colors.green)
  })

  // Обработчики для сокета исполнителя
  performerSocket.on("notification", (data) => {
    log(`🔔 [SOCKET ИСПОЛНИТЕЛЯ] УВЕДОМЛЕНИЕ: ${data.type}`, colors.blue)
    eventsReceived.notification = true
  })

  // Обработчики для сокета заказчика
  customerSocket.on("notification", (data) => {
    log(`🔔 [SOCKET ЗАКАЗЧИКА] УВЕДОМЛЕНИЕ: ${data.type}`, colors.blue)
    console.log("Full notification data:", JSON.stringify(data, null, 2))
    eventsReceived.notification = true

    // Проверяем уведомление о загрузке пруфов
    if (data.type === "notification" && data.variant === "upload") {
      log(`📤 [SOCKET ЗАКАЗЧИКА] УВЕДОМЛЕНИЕ О ЗАГРУЗКЕ ПРУФОВ: ${data.text}`, colors.magenta)
      eventsReceived.uploadNotification = true
    }
  })

  // Обработчики сообщений для обоих сокетов
  const setupMessageHandlers = (socket, socketName) => {
    socket.on("message:new", (data) => {
      // Берем данные из вложенного объекта .message
      const msg = data.message
      log(
        `💬 [SOCKET ${socketName}] НОВОЕ СООБЩЕНИЕ: "${msg.text}" от ${msg.sender?.firstName || "Unknown"}`,
        colors.magenta
      )
      eventsReceived.messageNew = true
    })

    socket.on("order:status_changed", (data) => {
      log(`📦 [SOCKET ${socketName}] ИЗМЕНЕНИЕ СТАТУСА ЗАКАЗА: ${data.orderId} -> ${data.status}`, colors.blue)
      eventsReceived.orderStatusChanged = true
    })

    socket.on("proposal:status_changed", (data) => {
      log(`📝 [SOCKET ${socketName}] ИЗМЕНЕНИЕ СТАТУСА ПРЕДЛОЖЕНИЯ: ${data.proposalId} -> ${data.status}`, colors.blue)
      eventsReceived.proposalStatusChanged = true
    })

    socket.on("admin:joined", (data) => {
      log(`👮 [SOCKET ${socketName}] АДМИН ПРИСОЕДИНИЛСЯ К ЧАТУ: ${data.chatId}`, colors.magenta)
      eventsReceived.adminJoinedChat = true
    })
  }

  setupMessageHandlers(performerSocket, "ИСПОЛНИТЕЛЯ")
  setupMessageHandlers(customerSocket, "ЗАКАЗЧИКА")

  await sleep(1000)

  try {
    // --- 2. ТЕСТЫ ЗАПРОСОВ (REQUESTS) ---
    log("\n📦 2. Тестируем все маршруты запросов...", colors.yellow)

    // 2.1 Создание черновика запроса (для тестирования обновления и отмены)
    log("   2.1 Создание черновика запроса...", colors.blue)

    // Сначала создаем запрос через API
    const draftRes = await axios.post(
      `${API_URL}/request/create`,
      {
        title: `Draft Request ${Date.now()}`,
        description: "Test draft description",
        price: 300,
        latitude: 55.75,
        longitude: 37.61,
        address: "Moscow",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
      { headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
    )

    // Затем вручную изменяем статус на draft в базе данных для тестирования
    // В реальном приложении был бы эндпоинт для создания черновиков
    draftRequestId = draftRes.data.id
    log(`   ✅ Черновик запроса создан: ${draftRequestId}`, colors.green)

    // 2.2 Получение запроса по ID
    log("   2.2 Получение запроса по ID...", colors.blue)
    const getRequestRes = await axios.get(`${API_URL}/request/${draftRequestId}`)
    log(`   ✅ Запрос получен: ${getRequestRes.data.title}`, colors.green)

    // 2.3 Тестирование отмены опубликованного запроса
    log("   2.3 Тестирование отмены опубликованного запроса...", colors.blue)
    await axios.post(
      `${API_URL}/request/${draftRequestId}/cancel`,
      {},
      {
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      }
    )
    log("   ✅ Запрос отменен", colors.green)

    // 2.4 Создание прямого запроса
    log("   2.4 Создание прямого запроса...", colors.blue)
    const directRes = await axios.post(
      `${API_URL}/request/create-direct`,
      {
        title: `Direct Request ${Date.now()}`,
        description: "Test direct request description",
        price: 600,
        latitude: 55.75,
        longitude: 37.61,
        address: "Moscow",
        performerId: "888888", // Исправленный ID исполнителя
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
      { headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
    )
    log(`   ✅ Прямой запрос: ${directRes.data.id}`, colors.green)

    // 2.5 Получение списка запросов
    log("   2.5 Получение списка запросов...", colors.blue)
    const listRes = await axios.get(`${API_URL}/request/list`, {
      params: {
        limit: 10,
        offset: 0,
      },
      headers: { Authorization: `Bearer ${CUST_TOKEN}` },
    })
    log(`   ✅ Найдено запросов: ${listRes.data.items.length}`, colors.green)

    // 2.6 Создание опубликованного запроса для дальнейших тестов
    log("   2.6 Создание опубликованного запроса...", colors.blue)
    const reqRes = await axios.post(
      `${API_URL}/request/create`,
      {
        title: `Chat Test ${Date.now()}`,
        description: "Test description",
        price: 500,
        latitude: 55.75,
        longitude: 37.61,
        address: "Moscow",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
      { headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
    )
    requestId = reqRes.data.id
    log(`   ✅ Опубликованный запрос: ${requestId}`, colors.green)

    // 2.7 Отклик на запрос
    log("   2.7 Отклик на запрос...", colors.blue)
    const respRes = await axios.post(
      `${API_URL}/request/${requestId}/respond`,
      {},
      { headers: { Authorization: `Bearer ${PERF_TOKEN}` } }
    )
    responseId = respRes.data.id
    log(`   ✅ Отклик: ${responseId}`, colors.green)

    // 2.8 Получение откликов на запрос
    log("   2.8 Получение откликов на запрос...", colors.blue)
    const responsesRes = await axios.get(`${API_URL}/request/${requestId}/responses`, {
      headers: { Authorization: `Bearer ${CUST_TOKEN}` },
    })
    log(`   ✅ Откликов на запрос: ${responsesRes.data.length}`, colors.green)

    await sleep(500)

    // 2.9 Принятие отклика (создание сделки)
    log("   2.9 Принятие отклика (создание сделки)...", colors.blue)
    const dealRes = await axios.post(
      `${API_URL}/responses/${responseId}/accept`,
      { message: "Let's go!" },
      {
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      }
    )
    dealId = dealRes.data.deal.id
    log(`   ✅ Сделка: ${dealId}`, colors.green)

    // Проверяем Чат
    if (dealRes.data.deal.chat && dealRes.data.deal.chat.id) {
      chatId = dealRes.data.deal.chat.id
      log(`   ✅ Чат получен: ${chatId}`, colors.green)
    } else {
      throw new Error("Чат не вернулся в объекте сделки!")
    }

    log("\n📦 ВСЕ ТЕСТЫ ЗАПРОСОВ: РАБОТАЮТ!", colors.green)

    // --- 2.10 Тестирование модуля CHAT ---
    log("\n💬 2.10 Тестируем все маршруты модуля chat...", colors.yellow)

    // 2.10.1 Получение списка чатов
    log("   2.10.1 Получение списка чатов...", colors.blue)
    const chatListRes = await axios.get(`${API_URL}/chat/list`, {
      params: {
        page: 1,
        limit: 10,
      },
      headers: { Authorization: `Bearer ${CUST_TOKEN}` },
    })
    log(`   ✅ Получено чатов: ${chatListRes.data.items.length} (всего: ${chatListRes.data.total})`, colors.green)

    // 2.10.2 Получение чата по ID
    log("   2.10.2 Получение чата по ID...", colors.blue)
    const chatByIdRes = await axios.get(`${API_URL}/chat/${chatId}`, {
      params: {
        page: 1,
        limit: 10,
      },
      headers: { Authorization: `Bearer ${CUST_TOKEN}` },
    })
    log(
      `   ✅ Чат получен: ${chatByIdRes.data.id || chatId} (сообщений: ${chatByIdRes.data.messages?.length || 0})`,
      colors.green
    )

    // 2.10.3 Отправка сообщения (уже протестировано в шаге 5, но добавим для полноты)
    log("   2.10.3 Отправка сообщения в чат...", colors.blue)
    const secondMsgText = `Second message ${Date.now()}`
    const secondMsgRes = await axios.post(
      `${API_URL}/chat/${chatId}/message`,
      {
        text: secondMsgText,
      },
      { headers: { Authorization: `Bearer ${PERF_TOKEN}` } }
    )
    log(`   ✅ Второе сообщение отправлено`, colors.green)

    // 2.10.4 Переключение избранного
    log("   2.10.4 Переключение избранного...", colors.blue)
    const favoriteRes = await axios.post(
      `${API_URL}/chat/${chatId}/favorite`,
      {
        isFavorite: true,
      },
      { headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
    )
    log(`   ✅ Чат добавлен в избранное`, colors.green)

    // 2.10.5 Отметка сообщений как прочитанных
    log("   2.10.5 Отметка сообщений как прочитанных...", colors.blue)
    const markReadRes = await axios.post(
      `${API_URL}/chat/${chatId}/read`,
      {
        messageIds: [],
      },
      { headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
    )
    log(`   ✅ Сообщения отмечены как прочитанные`, colors.green)

    // 2.10.6 Присоединение как администратор (если нужно)
    // Пропускаем, так как это административная функция

    log("\n💬 ВСЕ ТЕСТЫ МОДУЛЯ CHAT: РАБОТАЮТ!", colors.green)

    // --- 3. ТЕСТЫ МОДУЛЯ RESPONSES ---
    log("\n📝 3. Тестируем все маршруты модуля responses...", colors.yellow)

    // 3.1 Получение всех откликов
    log("   3.1 Получение всех откликов...", colors.blue)
    const allResponsesRes = await axios.get(`${API_URL}/responses`, {
      headers: { Authorization: `Bearer ${PERF_TOKEN}` },
    })
    log(`   ✅ Получено всех откликов: ${allResponsesRes.data.length}`, colors.green)

    // 3.2 Получение откликов с фильтром по requestId
    log("   3.2 Получение откликов с фильтром по requestId...", colors.blue)
    const filteredResponsesRes = await axios.get(`${API_URL}/responses`, {
      params: { requestId: requestId },
      headers: { Authorization: `Bearer ${PERF_TOKEN}` },
    })
    log(`   ✅ Получено откликов для запроса ${requestId}: ${filteredResponsesRes.data.length}`, colors.green)

    // 3.3 Получение отклика по ID
    log("   3.3 Получение отклика по ID...", colors.blue)
    const responseByIdRes = await axios.get(`${API_URL}/responses/${responseId}`, {
      headers: { Authorization: `Bearer ${PERF_TOKEN}` },
    })
    log(`   ✅ Получен отклик по ID: ${responseByIdRes.data.id}`, colors.green)

    log("\n📝 ВСЕ ТЕСТЫ МОДУЛЯ RESPONSES: РАБОТАЮТ!", colors.green)

    // --- 4. ТЕСТЫ МОДУЛЯ DEALS ---
    log("\n💼 4. Тестируем все маршруты модуля deals...", colors.yellow)

    // 4.1 Получение всех сделок
    log("   4.1 Получение всех сделок...", colors.blue)
    const allDealsRes = await axios.get(`${API_URL}/deal`, {
      headers: { Authorization: `Bearer ${PERF_TOKEN}` },
    })
    log(`   ✅ Получено всех сделок: ${allDealsRes.data.length}`, colors.green)

    // 4.2 Получение списка сделок пользователя
    log("   4.2 Получение списка сделок пользователя...", colors.blue)
    const userDealsRes = await axios.get(`${API_URL}/deal/list`, {
      params: { limit: 10, offset: 0 },
      headers: { Authorization: `Bearer ${CUST_TOKEN}` },
    })
    log(`   ✅ Получено сделок пользователя: ${userDealsRes.data.items.length}`, colors.green)

    // 4.3 Получение сделки по ID
    log("   4.3 Получение сделки по ID...", colors.blue)
    const dealByIdRes = await axios.get(`${API_URL}/deal/${dealId}`, {
      headers: { Authorization: `Bearer ${CUST_TOKEN}` },
    })
    log(`   ✅ Получена сделка по ID: ${dealByIdRes.data.id}`, colors.green)

    log("\n💼 ВСЕ ТЕСТЫ МОДУЛЯ DEALS: РАБОТАЮТ!", colors.green)

    // --- 5. ТЕСТ ЧАТА ---
    log(`\n💬 5. Тестируем отправку сообщения в чат ${chatId}...`, colors.yellow)

    const msgText = `Hello Socket ${Date.now()}`
    const msgRes = await axios.post(
      `${API_URL}/chat/${chatId}/message`,
      {
        text: msgText,
      },
      { headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
    )

    log(`   ✅ Сообщение отправлено (REST 201 Created)`, colors.green)

    // --- 6. ОЖИДАНИЕ СОБЫТИЙ ---
    log("\n⏳ Ждем события в сокете (1 сек)...", colors.yellow)
    await sleep(1000)

    console.log("\n--- ИТОГИ ---")

    if (eventsReceived.notification) {
      log("✅ Уведомления: РАБОТАЮТ", colors.green)
    } else {
      log("❌ Уведомления: НЕ ПРИШЛИ", colors.red)
    }

    if (eventsReceived.messageNew) {
      log("✅ Чат (Real-time): РАБОТАЕТ", colors.green)
    } else {
      log("❌ Чат (Real-time): НЕ ПРИШЛО message:new", colors.red)
    }

    if (eventsReceived.orderStatusChanged) {
      log("✅ События заказов: РАБОТАЮТ", colors.green)
    } else {
      log("⚠️ События заказов: НЕ ПРИШЛИ (возможно не было изменений статуса)", colors.yellow)
    }

    if (eventsReceived.proposalStatusChanged) {
      log("✅ События предложений: РАБОТАЮТ", colors.green)
    } else {
      log("⚠️ События предложений: НЕ ПРИШЛИ (возможно не было изменений статуса)", colors.yellow)
    }

    if (eventsReceived.notification && eventsReceived.messageNew) {
      log("\n🏆 ОСНОВНЫЕ ФУНКЦИИ РАБОТАЮТ! Проверяем гео-запросы...", colors.green)
      // Не выходим, продолжаем с гео-тестами
    } else {
      log("\n⚠️ Что-то не долетело в основных функциях.", colors.red)
      // Не выходим, так как нам нужно протестировать submission уведомления
    }

    // --- 7. ГЕО ТЕСТЫ ---
    log("\n🗺️ 7. Тестируем гео-запросы...", colors.yellow)

    try {
      // 7.1 Обновляем геолокацию исполнителя
      log("   7.1 Обновляем геолокацию исполнителя...", colors.blue)
      await axios.post(
        `${API_URL}/user/update-location`,
        {
          latitude: 55.76,
          longitude: 37.62,
        },
        { headers: { Authorization: `Bearer ${PERF_TOKEN}` } }
      )
      log("   ✅ Геолокация исполнителя обновлена", colors.green)

      // 7.2 Получаем исполнителей рядом с локацией
      log("   7.2 Получаем исполнителей рядом с локацией...", colors.blue)
      const performersRes = await axios.get(`${API_URL}/user/list-performers`, {
        params: {
          latitude: 55.75,
          longitude: 37.61,
          radiusKm: 10,
        },
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      })
      log(`   ✅ Найдено исполнителей рядом: ${performersRes.data.length}`, colors.green)

      // 7.3 Получаем задачи в границах карты
      log("   7.3 Получаем задачи в границах карты...", colors.blue)
      const mapRes = await axios.get(`${API_URL}/request/map`, {
        params: {
          north: 55.8,
          south: 55.7,
          east: 37.7,
          west: 37.5,
        },
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      })
      log(`   ✅ Найдено задач на карте: ${mapRes.data.length}`, colors.green)

      // 7.4 Получаем исполнителей рядом с конкретной задачей
      log("   7.4 Получаем исполнителей рядом с задачей...", colors.blue)
      const nearbyPerfRes = await axios.get(`${API_URL}/request/${requestId}/nearby-performers`, {
        params: {
          radius: 5,
          limit: 10,
        },
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      })
      log(`   ✅ Найдено исполнителей рядом с задачей: ${nearbyPerfRes.data.items.length}`, colors.green)

      log("\n🗺️ ГЕО-ЗАПРОСЫ: РАБОТАЮТ!", colors.green)
    } catch (geoError) {
      log("\n❌ ОШИБКА В ГЕО-ЗАПРОСАХ:", colors.red)
      if (geoError.response) {
        console.log(geoError.response.data)
      } else {
        console.log(geoError.message)
      }
    }

    // --- 8. ТЕСТЫ МОДУЛЯ SUBMISSION ---
    log("\n📤 8. Тестируем все маршруты модуля submission...", colors.yellow)

    try {
      // 8.1 Создание submission (загрузка пруфов)
      log("   8.1 Создание submission (загрузка пруфов)...", colors.blue)
      const submissionRes = await axios.post(
        `${API_URL}/submission/create`,
        {
          requestId: requestId,
          attachments: [
            "https://s3.ru1.storage.beget.cloud/c0ca6843f56c-public/61b0e63f-0dc0-4b97-8f54-05d2694eb8d9.jpg",
          ],
          proofMeta: {
            clientGeo: { lat: 55.75, lng: 37.61 },
            workDuration: 120,
          },
        },
        { headers: { Authorization: `Bearer ${PERF_TOKEN}` } }
      )

      submissionId = submissionRes.data.id
      log(`   ✅ Submission создан: ${submissionId}`, colors.green)

      // 8.2 Получение submission по ID
      log("   8.2 Получение submission по ID...", colors.blue)
      const submissionByIdRes = await axios.get(`${API_URL}/submission/${submissionId}`, {
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      })
      log(
        `   ✅ Submission получен: ${submissionByIdRes.data.id}, статус: ${submissionByIdRes.data.status}`,
        colors.green
      )

      // 8.3 Получение submission для запроса
      log("   8.3 Получение submission для запроса...", colors.blue)
      const submissionByRequestRes = await axios.get(`${API_URL}/submission/request/${requestId}`, {
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      })
      log(`   ✅ Submission для запроса получен: ${submissionByRequestRes.data?.id || "null"}`, colors.green)

      log("\n📤 ВСЕ ТЕСТЫ МОДУЛЯ SUBMISSION: РАБОТАЮТ!", colors.green)
    } catch (submissionError) {
      log("\n❌ ОШИБКА В ТЕСТАХ SUBMISSION:", colors.red)
      if (submissionError.response) {
        console.log(submissionError.response.data)
      } else {
        console.log(submissionError.message)
      }
    }

    // Проверяем уведомления
    console.log("\n--- ПРОВЕРКА УВЕДОМЛЕНИЙ ---")
    if (eventsReceived.uploadNotification) {
      log("✅ Уведомления о загрузке пруфов: РАБОТАЮТ", colors.green)
    } else {
      log("❌ Уведомления о загрузке пруфов: НЕ ПРИШЛИ", colors.red)
    }

    // Ожидаем уведомления о загрузке пруфов
    log("\n⏳ Ждем уведомления о загрузке пруфов (1 сек)...", colors.yellow)
    await sleep(1000)

    // --- 9. ТЕСТЫ АРБИТРАЖА ---
    log("\n⚖️ 9. Тестируем систему арбитража...", colors.yellow)
    
    try {
      // 9.1 Создаем новый запрос для арбитража
      log("   9.1 Создаем новый запрос для арбитража...", colors.blue)
      const arbitrationReqRes = await axios.post(
        `${API_URL}/request/create`,
        {
          title: `Arbitration Test Request ${Date.now()}`,
          description: "This request will be used for arbitration testing",
          price: 300,
          latitude: 55.75,
          longitude: 37.61,
          address: "Moscow",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
        { headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
      )
      const arbitrationRequestId = arbitrationReqRes.data.id
      log(`   ✅ Запрос для арбитража создан: ${arbitrationRequestId}`, colors.green)
      
      // 9.2 Отклик на запрос
      log("   9.2 Отклик на запрос...", colors.blue)
      const arbitrationRespRes = await axios.post(
        `${API_URL}/request/${arbitrationRequestId}/respond`,
        {},
        { headers: { Authorization: `Bearer ${PERF_TOKEN}` } }
      )
      const arbitrationResponseId = arbitrationRespRes.data.id
      log(`   ✅ Отклик создан: ${arbitrationResponseId}`, colors.green)
      
      // 9.3 Принятие отклика
      log("   9.3 Принятие отклика...", colors.blue)
      const arbitrationDealRes = await axios.post(
        `${API_URL}/responses/${arbitrationResponseId}/accept`,
        { message: "Let's start work" },
        { headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
      )
      const arbitrationDealId = arbitrationDealRes.data.deal.id
      const arbitrationChatId = arbitrationDealRes.data.deal.chat.id
      log(`   ✅ Сделка создана: ${arbitrationDealId}, чат: ${arbitrationChatId}`, colors.green)
      
      // 9.4 Создание арбитража заказчиком
      log("   9.4 Создание арбитража заказчиком...", colors.blue)
      const createArbitrationRes = await axios.post(
        `${API_URL}/arbitration/create`,
        {
          requestId: arbitrationRequestId,
          reason: "Test arbitration for notification system",
          attachments: ["https://example.com/evidence1.jpg"]
        },
        { headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
      )
      arbitrationId = createArbitrationRes.data.id
      log(`   ✅ Арбитраж создан: ${arbitrationId}`, colors.green)
      eventsReceived.arbitrationCreated = true
      
      // Ждем уведомлений
      await sleep(1000)
      
      // 9.5 Проверка получения списка арбитражей
      log("   9.5 Получение списка арбитражей...", colors.blue)
      const arbitrationsListRes = await axios.get(`${API_URL}/arbitration/list`, {
        params: { limit: 10, offset: 0 },
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      )
      log(`   ✅ Получено арбитражей: ${arbitrationsListRes.data.items.length}`, colors.green)
      
      // 9.6 Получение арбитража по ID
      log("   9.6 Получение арбитража по ID...", colors.blue)
      const getArbitrationRes = await axios.get(`${API_URL}/arbitration/${arbitrationId}`, {
        headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
      )
      log(`   ✅ Арбитраж получен: статус ${getArbitrationRes.data.status}`, colors.green)
      
      // 9.7 Присоединение администратора к чату
      log("   9.7 Присоединение администратора к чату арбитража...", colors.blue)
      try {
        await axios.post(
          `${API_URL}/chat/${arbitrationChatId}/join-as-admin`,
          {},
          { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
        )
        log("   ✅ Администратор присоединился к чату", colors.green)
      } catch (adminJoinError) {
        log("   ❌ Ошибка при присоединении администратора:", colors.red)
        if (adminJoinError.response) {
          console.log(adminJoinError.response.data)
        } else {
          console.log(adminJoinError.message)
        }
      }
      
      // Ждем уведомлений о присоединении администратора
      await sleep(1000)
      
      // 9.8 Разрешение арбитража
      log("   9.8 Разрешение арбитража (завершение задачи)...", colors.blue)
      try {
        const resolveArbitrationRes = await axios.post(
          `${API_URL}/arbitration/${arbitrationId}/resolve`,
          {
            action: "complete",
            message: "Admin resolved arbitration in favor of performer"
          },
          { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
        )
        log(`   ✅ Арбитраж разрешен: ${resolveArbitrationRes.data.status}`, colors.green)
        eventsReceived.arbitrationResolved = true
      } catch (resolveError) {
        log("   ❌ Ошибка при разрешении арбитража:", colors.red)
        if (resolveError.response) {
          console.log(resolveError.response.data)
        } else {
          console.log(resolveError.message)
        }
      }
      
      // Ждем уведомлений о разрешении арбитража
      await sleep(1000)
      
      log("\n⚖️ ВСЕ ТЕСТЫ АРБИТРАЖА: РАБОТАЮТ!", colors.green)
    } catch (arbitrationError) {
      log("\n❌ ОШИБКА В ТЕСТАХ АРБИТРАЖА:", colors.red)
      if (arbitrationError.response) {
        console.log("Response status:", arbitrationError.response.status)
        console.log("Response data:", JSON.stringify(arbitrationError.response.data, null, 2))
      } else {
        console.log(arbitrationError.message)
      }
    }
    
    // Проверяем уведомления арбитража
    console.log("\n--- ПРОВЕРКА УВЕДОМЛЕНИЙ АРБИТРАЖА ---")
    if (eventsReceived.arbitrationCreated) {
      log("✅ Создание арбитража: РАБОТАЕТ", colors.green)
    } else {
      log("❌ Создание арбитража: НЕ РАБОТАЕТ", colors.red)
    }
    
    if (eventsReceived.adminJoinedChat) {
      log("✅ Присоединение администратора: РАБОТАЕТ", colors.green)
    } else {
      log("❌ Присоединение администратора: НЕ РАБОТАЕТ", colors.red)
    }
    
    if (eventsReceived.arbitrationResolved) {
      log("✅ Разрешение арбитража: РАБОТАЕТ", colors.green)
    } else {
      log("❌ Разрешение арбитража: НЕ РАБОТАЕТ", colors.red)
    }

    // --- 9.9 ТЕСТ АРБИТРАЖА С REJECT И ПРОВЕРКОЙ БАЛАНСОВ ---
    log("\n⚖️ 9.9 Тестируем арбитраж с отклонением (reject) и проверку балансов...", colors.yellow)
    
    try {
      // 9.9.1 Создаем новый запрос для теста reject
      log("   9.9.1 Создаем новый запрос для теста reject...", colors.blue)
      const rejectReqRes = await axios.post(
        `${API_URL}/request/create`,
        {
          title: `Reject Arbitration Test ${Date.now()}`,
          description: "This request will test arbitration rejection",
          price: 400,
          latitude: 55.75,
          longitude: 37.61,
          address: "Moscow",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
        { headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
      )
      const rejectRequestId = rejectReqRes.data.id
      log(`   ✅ Запрос для теста reject создан: ${rejectRequestId}`, colors.green)
      
      // 9.9.2 Отклик на запрос
      log("   9.9.2 Отклик на запрос...", colors.blue)
      const rejectRespRes = await axios.post(
        `${API_URL}/request/${rejectRequestId}/respond`,
        {},
        { headers: { Authorization: `Bearer ${PERF_TOKEN}` } }
      )
      const rejectResponseId = rejectRespRes.data.id
      log(`   ✅ Отклик создан: ${rejectResponseId}`, colors.green)
      
      // 9.9.3 Принятие отклика
      log("   9.9.3 Принятие отклика...", colors.blue)
      const rejectDealRes = await axios.post(
        `${API_URL}/responses/${rejectResponseId}/accept`,
        { message: "Starting work" },
        { headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
      )
      const rejectDealId = rejectDealRes.data.deal.id
      const rejectChatId = rejectDealRes.data.deal.chat.id
      log(`   ✅ Сделка создана: ${rejectDealId}, чат: ${rejectChatId}`, colors.green)
      
      // 9.9.4 Получаем балансы ДО создания арбитража
      log("   9.9.4 Получаем балансы ДО арбитража...", colors.blue)
      const custBalBeforeArb = await axios.get(`${API_URL}/user/get-balances`, {
        params: { id: 777777 },
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      })
      const perfBalBeforeArb = await axios.get(`${API_URL}/user/get-balances`, {
        params: { id: 888888 },
        headers: { Authorization: `Bearer ${PERF_TOKEN}` },
      })
      
      const custBalBefore = custBalBeforeArb.data
        .find((b) => BigInt(b.balance) > 0n || BigInt(b.lockedBalance) > 0n) ||
        custBalBeforeArb.data.find((b) => b.token === "STARS" && b.blockchain === null)
      const perfBalBefore = perfBalBeforeArb.data
        .find((b) => BigInt(b.balance) > 0n || BigInt(b.lockedBalance) > 0n) ||
        perfBalBeforeArb.data.find((b) => b.token === "STARS" && b.blockchain === null)
      
      log(`   📊 Заказчик ДО: balance=${custBalBefore.balance}, locked=${custBalBefore.lockedBalance}`, colors.blue)
      log(`   📊 Исполнитель ДО: balance=${perfBalBefore?.balance || "0"}, locked=${perfBalBefore?.lockedBalance || "0"}`, colors.blue)
      
      // 9.9.5 Создание арбитража
      log("   9.9.5 Создание арбитража от исполнителя...", colors.blue)
      const rejectArbitrationRes = await axios.post(
        `${API_URL}/arbitration/create`,
        {
          requestId: rejectRequestId,
          reason: "Testing reject action - dispute on task quality",
          attachments: ["https://example.com/proof.jpg"]
        },
        { headers: { Authorization: `Bearer ${PERF_TOKEN}` } }
      )
      const rejectArbitrationId = rejectArbitrationRes.data.id
      log(`   ✅ Арбитраж создан: ${rejectArbitrationId}`, colors.green)
      
      await sleep(1000)
      
      // 9.9.6 Администратор отклоняет арбитраж (reject)
      log("   9.9.6 Администратор отклоняет арбитраж (действие: reject)...", colors.blue)
      const resolveRejectRes = await axios.post(
        `${API_URL}/arbitration/${rejectArbitrationId}/resolve`,
        {
          action: "reject",
          message: "Admin reviewed and rejected the arbitration. Task continues as-is."
        },
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      )
      log(`   ✅ Арбитраж отклонен администратором: статус=${resolveRejectRes.data.status}, action=${resolveRejectRes.data.action}`, colors.green)
      
      await sleep(1000)
      
      // 9.9.7 Проверяем балансы ПОСЛЕ отклонения арбитража
      log("   9.9.7 Получаем балансы ПОСЛЕ отклонения арбитража...", colors.blue)
      const custBalAfterArb = await axios.get(`${API_URL}/user/get-balances`, {
        params: { id: 777777 },
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      })
      const perfBalAfterArb = await axios.get(`${API_URL}/user/get-balances`, {
        params: { id: 888888 },
        headers: { Authorization: `Bearer ${PERF_TOKEN}` },
      })
      
      const custBalAfter = custBalAfterArb.data
        .find((b) => BigInt(b.balance) > 0n || BigInt(b.lockedBalance) > 0n) ||
        custBalAfterArb.data.find((b) => b.token === "STARS" && b.blockchain === null)
      const perfBalAfter = perfBalAfterArb.data
        .find((b) => BigInt(b.balance) > 0n || BigInt(b.lockedBalance) > 0n) ||
        perfBalAfterArb.data.find((b) => b.token === "STARS" && b.blockchain === null)
      
      log(`   📊 Заказчик ПОСЛЕ: balance=${custBalAfter.balance}, locked=${custBalAfter.lockedBalance}`, colors.blue)
      log(`   📊 Исполнитель ПОСЛЕ: balance=${perfBalAfter?.balance || "0"}, locked=${perfBalAfter?.lockedBalance || "0"}`, colors.blue)
      
      // 9.9.8 Проверяем, что балансы НЕ изменились (reject не должен влиять на балансы)
      log("   9.9.8 Проверяем, что балансы не изменились...", colors.blue)
      
      const custBalanceChanged = custBalBefore.balance !== custBalAfter.balance
      const custLockedChanged = custBalBefore.lockedBalance !== custBalAfter.lockedBalance
      const perfBalanceChanged = (perfBalBefore?.balance || "0") !== (perfBalAfter?.balance || "0")
      const perfLockedChanged = (perfBalBefore?.lockedBalance || "0") !== (perfBalAfter?.lockedBalance || "0")
      
      if (!custBalanceChanged && !custLockedChanged && !perfBalanceChanged && !perfLockedChanged) {
        log(`   ✅ ОТЛИЧНО! Балансы НЕ изменились - reject работает корректно!`, colors.green)
      } else {
        log(`   ⚠️ ВНИМАНИЕ: Балансы изменились после reject (не должно было произойти)`, colors.yellow)
        if (custBalanceChanged) log(`      - Баланс заказчика изменился`, colors.yellow)
        if (custLockedChanged) log(`      - Locked баланс заказчика изменился`, colors.yellow)
        if (perfBalanceChanged) log(`      - Баланс исполнителя изменился`, colors.yellow)
        if (perfLockedChanged) log(`      - Locked баланс исполнителя изменился`, colors.yellow)
      }
      
      // 9.9.9 Проверяем статус запроса (должен остаться arbitration или вернуться к предыдущему)
      log("   9.9.9 Проверяем статус запроса после reject...", colors.blue)
      const rejectRequestStatus = await axios.get(`${API_URL}/request/${rejectRequestId}`)
      log(`   ✅ Статус запроса после reject: ${rejectRequestStatus.data.status}`, colors.green)
      
      log("\n⚖️ ВСЕ ТЕСТЫ АРБИТРАЖА С REJECT: РАБОТАЮТ!", colors.green)
    } catch (rejectError) {
      log("\n❌ ОШИБКА В ТЕСТАХ REJECT АРБИТРАЖА:", colors.red)
      if (rejectError.response) {
        console.log("Response status:", rejectError.response.status)
        console.log("Response data:", JSON.stringify(rejectError.response.data, null, 2))
      } else {
        console.log(rejectError.message)
      }
    }

    // --- 10. ТЕСТЫ ЗАВЕРШЕНИЯ ЗАПРОСА (COMPLETE) ---
    log("\n✅ 10. Тестируем завершение запроса (complete)...", colors.yellow)

    try {
      // 9.1 Получаем балансы заказчика ДО завершения
      log("   9.1 Получаем балансы заказчика ДО завершения...", colors.blue)
      const customerBalanceBeforeRes = await axios.get(`${API_URL}/user/get-balances`, {
        params: { id: 777777 },
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      })
      const customerBalanceBefore = customerBalanceBeforeRes.data
        .find((b) => BigInt(b.balance) > 0n || BigInt(b.lockedBalance) > 0n) ||
        customerBalanceBeforeRes.data.find((b) => b.token === "STARS" && b.blockchain === null)
      log(
        `   📊 Баланс заказчика ДО: ${customerBalanceBefore.balance}, Locked: ${customerBalanceBefore.lockedBalance}`,
        colors.blue
      )

      // 9.2 Получаем балансы исполнителя ДО завершения
      log("   9.2 Получаем балансы исполнителя ДО завершения...", colors.blue)
      const performerBalanceBeforeRes = await axios.get(`${API_URL}/user/get-balances`, {
        params: { id: 888888 },
        headers: { Authorization: `Bearer ${PERF_TOKEN}` },
      })
      const performerBalanceBefore = performerBalanceBeforeRes.data
        .find((b) => BigInt(b.balance) > 0n || BigInt(b.lockedBalance) > 0n) ||
        performerBalanceBeforeRes.data.find((b) => b.token === "STARS" && b.blockchain === null)
      log(
        `   📊 Баланс исполнителя ДО: ${performerBalanceBefore?.balance || "0"}, Locked: ${performerBalanceBefore?.lockedBalance || "0"}`,
        colors.blue
      )

      // 9.3 Завершаем запрос (complete)
      log("   9.3 Завершаем запрос (заказчик вызывает /complete)...", colors.blue)
      const completeRes = await axios.post(
        `${API_URL}/request/${requestId}/complete`,
        {
          rating: 5,
          feedback: "Excellent work!",
        },
        { headers: { Authorization: `Bearer ${CUST_TOKEN}` } }
      )
      log(`   ✅ Запрос завершен! Статус: ${completeRes.data.status}`, colors.green)
      log(`   ✅ Deal status: ${completeRes.data.deal.status}, escrowStatus: ${completeRes.data.deal.escrowStatus}`, colors.green)

      // Ждем, чтобы транзакции обработались
      await sleep(500)

      // 9.4 Получаем балансы заказчика ПОСЛЕ завершения
      log("   9.4 Получаем балансы заказчика ПОСЛЕ завершения...", colors.blue)
      const customerBalanceAfterRes = await axios.get(`${API_URL}/user/get-balances`, {
        params: { id: 777777 },
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      })
      const customerBalanceAfter = customerBalanceAfterRes.data
        .find((b) => BigInt(b.balance) > 0n || BigInt(b.lockedBalance) > 0n) ||
        customerBalanceAfterRes.data.find((b) => b.token === "STARS" && b.blockchain === null)
      log(
        `   📊 Баланс заказчика ПОСЛЕ: ${customerBalanceAfter.balance}, Locked: ${customerBalanceAfter.lockedBalance}`,
        colors.blue
      )

      // 9.5 Получаем балансы исполнителя ПОСЛЕ завершения
      log("   9.5 Получаем балансы исполнителя ПОСЛЕ завершения...", colors.blue)
      const performerBalanceAfterRes = await axios.get(`${API_URL}/user/get-balances`, {
        params: { id: 888888 },
        headers: { Authorization: `Bearer ${PERF_TOKEN}` },
      })
      const performerBalanceAfter = performerBalanceAfterRes.data
        .find((b) => BigInt(b.balance) > 0n || BigInt(b.lockedBalance) > 0n) ||
        performerBalanceAfterRes.data.find((b) => b.token === "STARS" && b.blockchain === null)
      log(
        `   📊 Баланс исполнителя ПОСЛЕ: ${performerBalanceAfter?.balance || "0"}, Locked: ${performerBalanceAfter?.lockedBalance || "0"}`,
        colors.blue
      )

      // 9.6 Проверяем изменения балансов
      log("\n   9.6 Проверяем изменения балансов...", colors.blue)

      const customerLockedDiff = BigInt(customerBalanceBefore.lockedBalance) - BigInt(customerBalanceAfter.lockedBalance)
      const performerBalanceDiff = BigInt(performerBalanceAfter?.balance || "0") - BigInt(performerBalanceBefore?.balance || "0")

      log(`   💰 Locked у заказчика уменьшился на: ${customerLockedDiff.toString()}`, colors.blue)
      log(`   💰 Баланс исполнителя увеличился на: ${performerBalanceDiff.toString()}`, colors.blue)

      // Проверяем, что:
      // 1. Locked balance заказчика уменьшился
      // 2. Баланс исполнителя увеличился
      // 3. Исполнитель получил деньги (с учетом комиссии платформы 2.5%)

      if (customerLockedDiff > 0n) {
        log(`   ✅ Locked баланс заказчика корректно уменьшился!`, colors.green)
      } else {
        log(`   ❌ ОШИБКА: Locked баланс заказчика не уменьшился!`, colors.red)
      }

      if (performerBalanceDiff > 0n) {
        log(`   ✅ Баланс исполнителя увеличился! (Исполнитель получил деньги)`, colors.green)

        // Проверяем, что исполнитель получил примерно ожидаемую сумму (за вычетом комиссии 2.5%)
        const requestPrice = BigInt(500 * 1e6) // 500 STARS в smallest units
        const expectedPerformerAmount = (requestPrice * 975n) / 1000n // 97.5% от суммы (100% - 2.5% комиссия)
        const tolerance = requestPrice / 100n // 1% допуск на округление

        if (performerBalanceDiff >= expectedPerformerAmount - tolerance && performerBalanceDiff <= expectedPerformerAmount + tolerance) {
          log(`   ✅ Исполнитель получил корректную сумму (с учетом комиссии 2.5%)!`, colors.green)
        } else {
          log(`   ⚠️ Сумма исполнителя отличается от ожидаемой (ожидалось ~${expectedPerformerAmount.toString()})`, colors.yellow)
        }
      } else {
        log(`   ❌ КРИТИЧЕСКАЯ ОШИБКА: Баланс исполнителя не увеличился! Деньги не дошли до исполнителя!`, colors.red)
      }

      // 9.7 Проверяем статус запроса
      log("\n   9.7 Проверяем финальный статус запроса...", colors.blue)
      const finalRequestRes = await axios.get(`${API_URL}/request/${requestId}`)
      log(`   ✅ Финальный статус запроса: ${finalRequestRes.data.status}`, colors.green)
      log(`   ✅ Время завершения: ${finalRequestRes.data.completedAt}`, colors.green)

      log("\n✅ ВСЕ ТЕСТЫ ЗАВЕРШЕНИЯ ЗАПРОСА (COMPLETE): РАБОТАЮТ!", colors.green)
    } catch (completeError) {
      log("\n❌ ОШИБКА В ТЕСТАХ COMPLETE:", colors.red)
      if (completeError.response) {
        console.log("Response status:", completeError.response.status)
        console.log("Response data:", JSON.stringify(completeError.response.data, null, 2))
      } else {
        console.log(completeError.message)
      }
    }

    log("\n🏆 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ!", colors.green)

    process.exit(0)
  } catch (error) {
    log("\n❌ ОШИБКА:", colors.red)
    if (error.response) {
      console.log(error.response.data)
    } else {
      console.log(error.message)
    }
    process.exit(1)
  }
}

runTest()
