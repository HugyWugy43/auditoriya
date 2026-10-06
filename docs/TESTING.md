# Инструкция по проверке работы приложения

## Быстрая проверка

Запустите скрипт автоматической проверки:

```powershell
powershell -ExecutionPolicy Bypass -File test-services.ps1
```

## Ручная проверка

### 1. Проверка статуса контейнеров

```powershell
docker-compose ps
```

Все сервисы должны быть в статусе "Up".

### 2. Проверка микросервисов напрямую

#### User Service (порт 8081)
```powershell
Invoke-WebRequest -Uri "http://localhost:8081/api/users" -UseBasicParsing
```

#### Room Service (порт 8082)
```powershell
Invoke-WebRequest -Uri "http://localhost:8082/api/rooms" -UseBasicParsing
```

#### Booking Service (порт 8083)
```powershell
Invoke-WebRequest -Uri "http://localhost:8083/api/bookings" -UseBasicParsing
```

#### Notification Service (порт 8084)
```powershell
Invoke-WebRequest -Uri "http://localhost:8084/api/notifications" -UseBasicParsing
```

### 3. Создание тестовых данных

#### Создание пользователя
```powershell
$userData = @{
    username = "test_user"
    email = "test@example.com"
    password = "password123"
    firstName = "Test"
    lastName = "User"
    role = "STUDENT"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8081/api/users" `
    -Method POST `
    -ContentType "application/json" `
    -Body $userData `
    -UseBasicParsing
```

#### Создание аудитории
```powershell
$roomData = @{
    roomNumber = "101"
    name = "Lecture Hall 101"
    type = "LECTURE_HALL"
    capacity = 50
    description = "Test room"
    equipment = @("Projector", "Board")
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8082/api/rooms" `
    -Method POST `
    -ContentType "application/json" `
    -Body $roomData `
    -UseBasicParsing
```

#### Создание бронирования
```powershell
$startTime = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss")
$endTime = (Get-Date).AddHours(3).ToString("yyyy-MM-ddTHH:mm:ss")

$bookingData = @{
    userId = 1
    roomId = 1
    startTime = $startTime
    endTime = $endTime
    purpose = "Test booking"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8083/api/bookings" `
    -Method POST `
    -ContentType "application/json" `
    -Body $bookingData `
    -UseBasicParsing
```

### 4. Проверка через браузер

Откройте в браузере:
- http://localhost:8081/api/users - список пользователей
- http://localhost:8082/api/rooms - список аудиторий
- http://localhost:8083/api/bookings - список бронирований
- http://localhost:8084/api/notifications - список уведомлений

### 5. Просмотр логов

```powershell
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f user-service
docker-compose logs -f room-service
docker-compose logs -f booking-service
docker-compose logs -f notification-service
docker-compose logs -f api-gateway
```

### 6. Проверка базы данных

```powershell
# Подключение к PostgreSQL
docker exec -it audit_postgres psql -U postgres -d audit_system

# В psql выполните:
\dt                    # список таблиц
SELECT * FROM users;   # просмотр пользователей
SELECT * FROM rooms;   # просмотр аудиторий
SELECT * FROM bookings; # просмотр бронирований
\q                     # выход
```

## Ожидаемые результаты

✅ **Все сервисы работают:**
- User Service: HTTP 200 на GET /api/users
- Room Service: HTTP 200 на GET /api/rooms
- Booking Service: HTTP 200 на GET /api/bookings
- Notification Service: HTTP 200 на GET /api/notifications
- PostgreSQL: доступна и отвечает

✅ **Создание данных:**
- Пользователь: HTTP 201
- Аудитория: HTTP 201
- Бронирование: HTTP 201 (после создания пользователя и аудитории)

## Устранение проблем

### Порт 8080 занят
Если API Gateway недоступен на порту 8080, используйте прямые порты микросервисов (8081-8084).

### Ошибка 500 при создании бронирования
Проверьте логи:
```powershell
docker-compose logs booking-service
```

Убедитесь, что:
1. Пользователь и аудитория существуют
2. Время начала бронирования в будущем
3. Нет конфликтующих бронирований

### Сервис не отвечает
1. Проверьте статус: `docker-compose ps`
2. Перезапустите сервис: `docker-compose restart [service-name]`
3. Проверьте логи: `docker-compose logs [service-name]`



