# Инструкции по развертыванию

## Предварительные требования

- Java 17+
- Maven 3.8+
- Node.js 18+
- Docker & Docker Compose
- Kubernetes (опционально)
- PostgreSQL 14+ (или использовать Docker образ)

## Локальное развертывание

### 1. Запуск через Docker Compose

```bash
# Сборка и запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### 2. Ручной запуск сервисов

#### Запуск PostgreSQL
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_DB=audit_system \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:14
```

#### Сборка и запуск микросервисов
```bash
# User Service
cd user-service
mvn clean package
java -jar target/user-service-1.0.0.jar

# Room Service
cd room-service
mvn clean package
java -jar target/room-service-1.0.0.jar

# Booking Service
cd booking-service
mvn clean package
java -jar target/booking-service-1.0.0.jar

# Notification Service
cd notification-service
mvn clean package
java -jar target/notification-service-1.0.0.jar

# API Gateway
cd api-gateway
mvn clean package
java -jar target/api-gateway-1.0.0.jar
```

#### Запуск клиентского приложения
```bash
cd client
npm install
npm run dev
```

## Развертывание в Kubernetes

### 1. Сборка Docker образов

```bash
# Сборка образов для каждого сервиса
docker build -t user-service:latest ./user-service
docker build -t room-service:latest ./room-service
docker build -t booking-service:latest ./booking-service
docker build -t notification-service:latest ./notification-service
docker build -t api-gateway:latest ./api-gateway
docker build -t client:latest ./client

# Тегирование для registry (если используется)
docker tag user-service:latest registry.example.com/user-service:latest
docker push registry.example.com/user-service:latest
```

### 2. Применение манифестов

```bash
# Применить все манифесты
kubectl apply -f k8s/

# Проверить статус подов
kubectl get pods

# Проверить сервисы
kubectl get services

# Просмотр логов
kubectl logs -f deployment/user-service
```

### 3. Доступ к приложению

После развертывания получите внешний IP:

```bash
# Для API Gateway
kubectl get service api-gateway

# Для Client
kubectl get service client
```

## CI/CD с Jenkins

### Jenkinsfile

Создайте `Jenkinsfile` в корне проекта:

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
            }
        }
        
        stage('Docker Build') {
            steps {
                sh 'docker build -t user-service:latest ./user-service'
                sh 'docker build -t room-service:latest ./room-service'
                sh 'docker build -t booking-service:latest ./booking-service'
                sh 'docker build -t notification-service:latest ./notification-service'
                sh 'docker build -t api-gateway:latest ./api-gateway'
                sh 'docker build -t client:latest ./client'
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'kubectl apply -f k8s/'
            }
        }
    }
}
```

## Переменные окружения

### User Service
- `SPRING_DATASOURCE_URL` - URL базы данных
- `SPRING_DATASOURCE_USERNAME` - Имя пользователя БД
- `SPRING_DATASOURCE_PASSWORD` - Пароль БД
- `SERVER_PORT` - Порт сервиса (по умолчанию 8081)

### Room Service
- Аналогично User Service, порт 8082

### Booking Service
- Аналогично User Service, порт 8083
- `USER_SERVICE_URL` - URL User Service
- `ROOM_SERVICE_URL` - URL Room Service
- `NOTIFICATION_SERVICE_URL` - URL Notification Service

### API Gateway
- `SERVER_PORT` - Порт (по умолчанию 8080)
- `USER_SERVICE_URL` - URL User Service
- `ROOM_SERVICE_URL` - URL Room Service
- `BOOKING_SERVICE_URL` - URL Booking Service
- `NOTIFICATION_SERVICE_URL` - URL Notification Service

## Проверка работоспособности

### Проверка API Gateway
```bash
curl http://localhost:8080/api/users
```

### Проверка GraphQL
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ users { id username } }"}'
```

### Проверка клиентского приложения
Откройте браузер: http://localhost:3000

## Масштабирование

### Горизонтальное масштабирование в Kubernetes

```bash
# Увеличить количество реплик
kubectl scale deployment user-service --replicas=3

# Автоматическое масштабирование (требует установки HPA)
kubectl autoscale deployment user-service --min=2 --max=10 --cpu-percent=80
```

## Резервное копирование базы данных

```bash
# Создание бэкапа
docker exec postgres pg_dump -U postgres audit_system > backup.sql

# Восстановление
docker exec -i postgres psql -U postgres audit_system < backup.sql
```

## Мониторинг

### Просмотр метрик подов
```bash
kubectl top pods
kubectl top nodes
```

### Логирование
```bash
# Логи конкретного пода
kubectl logs <pod-name>

# Логи всех подов сервиса
kubectl logs -l app=user-service
```





