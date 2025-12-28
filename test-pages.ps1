$pages = @(
    @{url="http://localhost:3000"; name="Landing"},
    @{url="http://localhost:3000/login"; name="Login"},
    @{url="http://localhost:3000/register"; name="Register"},
    @{url="http://localhost:3000/catalog"; name="Catalog"},
    @{url="http://localhost:3000/welcome"; name="Welcome"},
    @{url="http://localhost:3000/api/health"; name="API Health"},
    @{url="http://localhost:3000/api/health/liveness"; name="API Liveness"},
    @{url="http://localhost:3000/api/health/readiness"; name="API Readiness"},
    @{url="http://localhost:3000/dashboard/admin"; name="Admin Dashboard"},
    @{url="http://localhost:3000/dashboard/restaurant"; name="Restaurant Dashboard"},
    @{url="http://localhost:3000/dashboard/driver"; name="Driver Dashboard"},
    @{url="http://localhost:3000/demo"; name="Demo"}
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PAGE TESTING RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

foreach ($page in $pages) {
    try {
        $response = Invoke-WebRequest -Uri $page.url -Method GET -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        $status = $response.StatusCode
        $color = if ($status -eq 200) { "Green" } elseif ($status -lt 400) { "Yellow" } else { "Red" }
        Write-Host "$($page.name): $status" -ForegroundColor $color
    } catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -match "(\d{3})") {
            Write-Host "$($page.name): $($matches[1]) (Error)" -ForegroundColor Red
        } else {
            Write-Host "$($page.name): FAILED - $errorMsg" -ForegroundColor Red
        }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing complete" -ForegroundColor Cyan
