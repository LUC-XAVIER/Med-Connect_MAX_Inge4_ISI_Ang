# Script to Clear Cache and Restart Dev Server
Write-Host "=== Clearing Angular Cache ===" -ForegroundColor Yellow
cd "C:\Users\user\Desktop\MEDCCONNECT\Med-Connect_MAX_Inge4_ISI_Ang\med-connect-WebFront"

# Remove Angular cache
if (Test-Path .angular) {
    Remove-Item -Recurse -Force .angular
    Write-Host "✓ Angular cache cleared" -ForegroundColor Green
} else {
    Write-Host "✓ No Angular cache found" -ForegroundColor Green
}

# Check for node processes
Write-Host "`n=== Checking for running dev servers ===" -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) node processes running" -ForegroundColor Yellow
    Write-Host "Please stop the Angular dev server manually (Ctrl+C in the terminal where it's running)" -ForegroundColor Red
    Write-Host "Then run: npm start" -ForegroundColor Cyan
} else {
    Write-Host "✓ No node processes found" -ForegroundColor Green
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Yellow
Write-Host "1. Make sure ALL files are saved (Ctrl+S)" -ForegroundColor Cyan
Write-Host "2. Stop the dev server if running (Ctrl+C)" -ForegroundColor Cyan
Write-Host "3. Run: npm start" -ForegroundColor Cyan
Write-Host "4. Wait for 'Compiled successfully'" -ForegroundColor Cyan
Write-Host "5. In browser: Press Ctrl+Shift+R (hard refresh)" -ForegroundColor Cyan
Write-Host "6. Or use Incognito window (Ctrl+Shift+N)" -ForegroundColor Cyan

