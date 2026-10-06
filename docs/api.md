# API Документация

## REST API Endpoints

Все запросы проходят через API Gateway на порту 8080.

### User Service

#### GET /api/users
Получить список всех пользователей

**Ответ:**
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "createdAt": "2024-01-01T10:00:00",
    "updatedAt": "2024-01-01T10:00:00"
  }
]
```

#### GET /api/users/{id}
Получить пользователя по ID

#### POST /api/users
Создать нового пользователя

**Тело запроса:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT"
}
```

#### PUT /api/users/{id}
Обновить пользователя

#### DELETE /api/users/{id}
Удалить пользователя

### Room Service

#### GET /api/rooms
Получить список всех аудиторий

**Ответ:**
```json
[
  {
    "id": 1,
    "roomNumber": "101",
    "name": "Лекционная аудитория 101",
    "type": "LECTURE_HALL",
    "capacity": 50,
    "description": "Большая лекционная аудитория",
    "equipment": ["Проектор", "Доска"],
    "isActive": true,
    "createdAt": "2024-01-01T10:00:00",
    "updatedAt": "2024-01-01T10:00:00"
  }
]
```

#### GET /api/rooms/{id}
Получить аудиторию по ID

#### GET /api/rooms/type/{type}
Получить аудитории по типу

#### POST /api/rooms
Создать новую аудиторию

**Тело запроса:**
```json
{
  "roomNumber": "101",
  "name": "Лекционная аудитория 101",
  "type": "LECTURE_HALL",
  "capacity": 50,
  "description": "Описание",
  "equipment": ["Проектор", "Доска"]
}
```

### Booking Service

#### GET /api/bookings
Получить список всех бронирований

#### GET /api/bookings/{id}
Получить бронирование по ID

#### GET /api/bookings/user/{userId}
Получить бронирования пользователя

#### GET /api/bookings/room/{roomId}
Получить бронирования аудитории

#### POST /api/bookings
Создать новое бронирование

**Тело запроса:**
```json
{
  "userId": 1,
  "roomId": 1,
  "startTime": "2024-01-15T10:00:00",
  "endTime": "2024-01-15T12:00:00",
  "purpose": "Лекция по программированию"
}
```

#### POST /api/bookings/{id}/cancel
Отменить бронирование

### Notification Service

#### GET /api/notifications
Получить все уведомления

#### GET /api/notifications/unread
Получить непрочитанные уведомления

#### POST /api/notifications
Создать уведомление

**Тело запроса:**
```json
{
  "message": "Бронирование подтверждено"
}
```

## GraphQL API

### Endpoint
`POST /graphql`

### Запросы (Queries)

#### Получить всех пользователей
```graphql
query {
  users {
    id
    username
    email
    firstName
    lastName
    role
  }
}
```

#### Получить пользователя по ID
```graphql
query {
  user(id: "1") {
    id
    username
    email
  }
}
```

#### Получить все аудитории
```graphql
query {
  rooms {
    id
    roomNumber
    name
    type
    capacity
  }
}
```

#### Получить бронирования пользователя
```graphql
query {
  bookingsByUser(userId: "1") {
    id
    roomId
    startTime
    endTime
    status
  }
}
```

### Мутации (Mutations)

#### Создать пользователя
```graphql
mutation {
  createUser(
    username: "john_doe"
    email: "john@example.com"
    password: "password123"
    firstName: "John"
    lastName: "Doe"
    role: STUDENT
  ) {
    id
    username
  }
}
```

#### Создать аудиторию
```graphql
mutation {
  createRoom(
    roomNumber: "101"
    name: "Лекционная аудитория"
    type: LECTURE_HALL
    capacity: 50
  ) {
    id
    roomNumber
  }
}
```

#### Создать бронирование
```graphql
mutation {
  createBooking(
    userId: "1"
    roomId: "1"
    startTime: "2024-01-15T10:00:00"
    endTime: "2024-01-15T12:00:00"
    purpose: "Лекция"
  ) {
    id
    status
  }
}
```

#### Отменить бронирование
```graphql
mutation {
  cancelBooking(id: "1")
}
```

## Коды ответов

- `200 OK` - Успешный запрос
- `201 Created` - Ресурс успешно создан
- `400 Bad Request` - Неверный запрос
- `404 Not Found` - Ресурс не найден
- `500 Internal Server Error` - Внутренняя ошибка сервера





