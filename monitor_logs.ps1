# PowerShell script to monitor Laravel logs in real-time
$logFile = "storage\logs\laravel.log"

if (Test-Path $logFile) {
    Write-Host "Monitoring Laravel logs... Press Ctrl+C to stop" -ForegroundColor Green
    Get-Content $logFile -Wait -Tail 10
} else {
    Write-Host "Laravel log file not found at: $logFile" -ForegroundColor Red
    Write-Host "Creating empty log file..." -ForegroundColor Yellow
    New-Item -Path $logFile -ItemType File -Force
    Write-Host "Now monitoring Laravel logs... Press Ctrl+C to stop" -ForegroundColor Green
    Get-Content $logFile -Wait -Tail 10
}