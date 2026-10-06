# Script to test all services

Write-Host "=== Testing Room Booking System ===" -ForegroundColor Green
Write-Host ""

# Check container status
Write-Host "1. Checking container status..." -ForegroundColor Yellow
docker-compose ps
Write-Host ""

# Test User Service directly
Write-Host "2. Testing User Service (port 8081)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/users" -UseBasicParsing
    Write-Host "   OK User Service is working! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ERROR User Service is not responding: $_" -ForegroundColor Red
}
Write-Host ""

# Test Room Service directly
Write-Host "3. Testing Room Service (port 8082)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8082/api/rooms" -UseBasicParsing
    Write-Host "   OK Room Service is working! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ERROR Room Service is not responding: $_" -ForegroundColor Red
}
Write-Host ""

# Test Booking Service directly
Write-Host "4. Testing Booking Service (port 8083)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8083/api/bookings" -UseBasicParsing
    Write-Host "   OK Booking Service is working! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ERROR Booking Service is not responding: $_" -ForegroundColor Red
}
Write-Host ""

# Test Notification Service directly
Write-Host "5. Testing Notification Service (port 8084)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8084/api/notifications" -UseBasicParsing
    Write-Host "   OK Notification Service is working! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ERROR Notification Service is not responding: $_" -ForegroundColor Red
}
Write-Host ""

# Test API Gateway
Write-Host "6. Testing API Gateway (port 8080)..." -ForegroundColor Yellow
Write-Host "   Note: If port 8080 is busy, use direct microservice ports" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/users" -UseBasicParsing -ErrorAction Stop
    Write-Host "   OK API Gateway is working! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   WARNING API Gateway is not accessible on port 8080 (port may be busy)" -ForegroundColor Yellow
    Write-Host "   Use direct microservice ports (8081-8084)" -ForegroundColor Gray
}
Write-Host ""

# Test database
Write-Host "7. Testing PostgreSQL database..." -ForegroundColor Yellow
try {
    docker exec audit_postgres pg_isready -U postgres | Out-Null
    Write-Host "   OK PostgreSQL is working!" -ForegroundColor Green
} catch {
    Write-Host "   ERROR PostgreSQL is not responding" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Testing Data Creation ===" -ForegroundColor Green
Write-Host ""

# Create test user
Write-Host "8. Creating test user..." -ForegroundColor Yellow
$userData = @{
    username = "test_user"
    email = "test@example.com"
    password = "password123"
    firstName = "Test"
    lastName = "User"
    role = "STUDENT"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/users" `
        -Method POST `
        -ContentType "application/json" `
        -Body $userData `
        -UseBasicParsing
    Write-Host "   OK User created! Status: $($response.StatusCode)" -ForegroundColor Green
    $createdUser = $response.Content | ConvertFrom-Json
    Write-Host "   User ID: $($createdUser.id)" -ForegroundColor Gray
    $global:testUserId = $createdUser.id
} catch {
    Write-Host "   ERROR Failed to create user: $_" -ForegroundColor Red
}
Write-Host ""

# Create test room
Write-Host "9. Creating test room..." -ForegroundColor Yellow
$roomData = @{
    roomNumber = "101"
    name = "Lecture Hall 101"
    type = "LECTURE_HALL"
    capacity = 50
    description = "Test room"
    equipment = @("Projector", "Board")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8082/api/rooms" `
        -Method POST `
        -ContentType "application/json" `
        -Body $roomData `
        -UseBasicParsing
    Write-Host "   OK Room created! Status: $($response.StatusCode)" -ForegroundColor Green
    $createdRoom = $response.Content | ConvertFrom-Json
    Write-Host "   Room ID: $($createdRoom.id)" -ForegroundColor Gray
    $global:testRoomId = $createdRoom.id
} catch {
    Write-Host "   ERROR Failed to create room: $_" -ForegroundColor Red
}
Write-Host ""

# Create test booking
if ($global:testUserId -and $global:testRoomId) {
    Write-Host "10. Creating test booking..." -ForegroundColor Yellow
    $startTime = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss")
    $endTime = (Get-Date).AddHours(3).ToString("yyyy-MM-ddTHH:mm:ss")
    
    $bookingData = @{
        userId = $global:testUserId
        roomId = $global:testRoomId
        startTime = $startTime
        endTime = $endTime
        purpose = "Test booking"
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8083/api/bookings" `
            -Method POST `
            -ContentType "application/json" `
            -Body $bookingData `
            -UseBasicParsing
        Write-Host "   OK Booking created! Status: $($response.StatusCode)" -ForegroundColor Green
        $createdBooking = $response.Content | ConvertFrom-Json
        Write-Host "   Booking ID: $($createdBooking.id)" -ForegroundColor Gray
    } catch {
        Write-Host "   ERROR Failed to create booking: $_" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "=== Testing Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  - User Service: http://localhost:8081/api/users" -ForegroundColor White
Write-Host "  - Room Service: http://localhost:8082/api/rooms" -ForegroundColor White
Write-Host "  - Booking Service: http://localhost:8083/api/bookings" -ForegroundColor White
Write-Host "  - Notification Service: http://localhost:8084/api/notifications" -ForegroundColor White
Write-Host "  - API Gateway: http://localhost:8080/api/* (if port is free)" -ForegroundColor White
Write-Host ""
Write-Host "To view logs use:" -ForegroundColor Cyan
Write-Host "  docker-compose logs -f [service-name]" -ForegroundColor White
