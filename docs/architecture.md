# Архитектура системы управления бронированием аудиторий

## Обзор системы

Система управления бронированием учебных аудиторий и лабораторий построена на основе микросервисной архитектуры с использованием API Gateway и GraphQL для единой точки входа.

## Архитектурные стили и паттерны

### 1. Микросервисная архитектура

Система разделена на независимые микросервисы:

- **User Service** (Порт 8081) - управление пользователями
- **Room Service** (Порт 8082) - управление аудиториями
- **Booking Service** (Порт 8083) - управление бронированиями
- **Notification Service** (Порт 8084) - отправка уведомлений

Каждый микросервис:
- Имеет собственную базу данных (общая PostgreSQL с разными схемами)
- Может масштабироваться независимо
- Общается с другими сервисами через HTTP/REST API

### 2. API Gateway Pattern

**API Gateway** (Порт 8080) выполняет следующие функции:
- Единая точка входа для всех клиентов
- Маршрутизация запросов к соответствующим микросервисам
- Агрегация данных из нескольких сервисов
- GraphQL endpoint для гибких запросов

### 3. MVC (Model-View-Controller)

Каждый микросервис использует паттерн MVC:

- **Model** - JPA Entity классы (User, Room, Booking, Notification)
- **View** - REST API endpoints (JSON responses)
- **Controller** - REST Controllers для обработки HTTP запросов
- **Service** - Бизнес-логика
- **Repository** - Доступ к данным через JPA

## Технологический стек

### Backend
- **Java 17** - основной язык программирования
- **Spring Boot 3.1.0** - фреймворк для микросервисов
- **Spring Data JPA** - работа с базой данных
- **Spring Cloud Gateway** - API Gateway
- **GraphQL** - GraphQL API
- **PostgreSQL 14** - реляционная база данных

### Frontend
- **JavaScript/React** - клиентское приложение
- **Vite** - сборщик и dev-сервер
- **Axios** - HTTP клиент
- **React Router** - маршрутизация

### Инфраструктура
- **Docker** - контейнеризация
- **Kubernetes** - оркестрация контейнеров
- **Jenkins** - CI/CD pipeline
- **Git** - система контроля версий

## Схема взаимодействия компонентов

```
┌─────────────┐
│   Client    │ (React App)
└──────┬──────┘
       │ HTTP/REST, GraphQL
       │
┌──────▼──────────────┐
│   API Gateway       │ (Port 8080)
│   - REST Routing    │
│   - GraphQL         │
└──────┬──────────────┘
       │
       ├──────────┬──────────┬──────────┐
       │          │          │          │
┌──────▼──┐ ┌─────▼──┐ ┌─────▼──┐ ┌─────▼──┐
│  User   │ │  Room  │ │Booking │ │Notify  │
│ Service │ │Service │ │Service │ │Service │
│ :8081   │ │ :8082  │ │ :8083  │ │ :8084  │
└────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
     │          │          │          │
     └──────────┴──────────┴──────────┘
                    │
            ┌───────▼───────┐
            │  PostgreSQL   │
            │   Database     │
            └───────────────┘
```

## Модель данных (ER диаграмма)

### Сущности:

1. **User** (Пользователь)
   - id (PK)
   - username (UNIQUE)
   - email (UNIQUE)
   - password
   - firstName
   - lastName
   - role (STUDENT, TEACHER, ADMIN)
   - createdAt
   - updatedAt

2. **Room** (Аудитория)
   - id (PK)
   - roomNumber (UNIQUE)
   - name
   - type (LECTURE_HALL, LABORATORY, COMPUTER_LAB, SEMINAR_ROOM, STUDY_ROOM)
   - capacity
   - description
   - equipment (List)
   - isActive
   - createdAt
   - updatedAt

3. **Booking** (Бронирование)
   - id (PK)
   - userId (FK -> User)
   - roomId (FK -> Room)
   - startTime
   - endTime
   - purpose
   - status (PENDING, CONFIRMED, CANCELLED, COMPLETED)
   - createdAt
   - updatedAt

4. **Notification** (Уведомление)
   - id (PK)
   - message
   - createdAt
   - isRead

### Связи:
- User 1:N Booking (один пользователь может иметь много бронирований)
- Room 1:N Booking (одна аудитория может иметь много бронирований)

## DFD (Data Flow Diagram)

### Уровень 0 (Контекстная диаграмма):
```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ Запросы/Ответы
     │
┌────▼─────────────┐
│  API Gateway     │
└────┬─────────────┘
     │
     │ Распределение запросов
     │
┌────┴────────────────────────────┐
│  Микросервисы                   │
│  (User, Room, Booking, Notify)  │
└─────────────────────────────────┘
```

### Уровень 1 (Детализация процесса бронирования):
1. Клиент отправляет запрос на создание бронирования
2. API Gateway маршрутизирует запрос в Booking Service
3. Booking Service проверяет существование пользователя (User Service)
4. Booking Service проверяет существование аудитории (Room Service)
5. Booking Service проверяет конфликты времени
6. Booking Service создает бронирование
7. Booking Service отправляет уведомление (Notification Service)
8. Ответ возвращается клиенту через API Gateway

## Развертывание

### Docker Compose
Все сервисы могут быть развернуты через `docker-compose up`

### Kubernetes
Манифесты находятся в папке `k8s/`:
- Каждый сервис имеет Deployment и Service
- PostgreSQL использует PersistentVolumeClaim для хранения данных
- API Gateway и Client используют LoadBalancer для внешнего доступа

## Безопасность

- Валидация входных данных на уровне контроллеров
- Проверка существования связанных сущностей перед созданием
- Проверка конфликтов времени при бронировании
- Изоляция сервисов через сетевые политики Kubernetes

## Масштабируемость

- Каждый микросервис может масштабироваться независимо
- Горизонтальное масштабирование через реплики в Kubernetes
- База данных может быть вынесена в отдельный кластер

## Мониторинг и логирование

- Логирование на уровне Spring Boot
- Централизованное логирование через Kubernetes
- Метрики через Spring Actuator (можно добавить)





