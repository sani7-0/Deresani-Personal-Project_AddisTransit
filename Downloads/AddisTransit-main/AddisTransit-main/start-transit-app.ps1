# Transit App Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    TRANSIT APP - STARTUP SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to start PHP server
function Start-PHPServer {
    Write-Host "[$(Get-Date)] Starting PHP Server..." -ForegroundColor Green
    Set-Location "backend\php-api"
    Start-Process -FilePath "php" -ArgumentList "-S", "0.0.0.0:3001", "-t", "public" -WindowStyle Minimized
    Set-Location "..\.."
    Write-Host "[$(Get-Date)] PHP Server started on port 3001" -ForegroundColor Green
}

# Function to start frontend
function Start-Frontend {
    Write-Host "[$(Get-Date)] Starting Frontend Server..." -ForegroundColor Green
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Minimized
    Write-Host "[$(Get-Date)] Frontend Server started on port 3000" -ForegroundColor Green
}

# Function to check if server is running
function Test-Server {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# Start both servers
Start-PHPServer
Start-Sleep 3
Start-Frontend

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    BOTH SERVERS STARTED SUCCESSFULLY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "API: http://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "Monitoring servers... Press Ctrl+C to stop" -ForegroundColor Magenta
Write-Host ""

# Monitor loop
while ($true) {
    if (-not (Test-Server)) {
        Write-Host "[$(Get-Date)] API Server is down! Restarting..." -ForegroundColor Red
        Get-Process -Name "php" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep 2
        Start-PHPServer
    }
    else {
        Write-Host "[$(Get-Date)] API Server: OK" -ForegroundColor Green
    }
    Start-Sleep 10
}
