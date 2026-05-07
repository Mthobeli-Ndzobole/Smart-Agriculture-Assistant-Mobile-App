param(
  [switch]$SkipInstall,
  [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$scriptVersion = "2026-05-02.5"

function Assert-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found on PATH."
  }
}

function Refresh-PathFromSystem {
  $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
  if ($machinePath -and $userPath) {
    $env:Path = "$machinePath;$userPath"
  } elseif ($machinePath) {
    $env:Path = $machinePath
  } elseif ($userPath) {
    $env:Path = $userPath
  }
}

function Add-DirToPathIfExists {
  param([string]$Dir)
  if (-not $Dir) { return $false }
  if (-not (Test-Path $Dir)) { return $false }

  $parts = $env:Path -split ';'
  if (-not ($parts -contains $Dir)) {
    $env:Path = "$Dir;$env:Path"
  }
  return $true
}

function Ensure-NodeTooling {
  $npm = Get-Command npm -ErrorAction SilentlyContinue
  $npx = Get-Command npx -ErrorAction SilentlyContinue
  if ($npm -and $npx) { return }

  $candidateDirs = @()
  if ($env:ProgramFiles) {
    $candidateDirs += (Join-Path $env:ProgramFiles "nodejs")
  }
  if (${env:ProgramFiles(x86)}) {
    $candidateDirs += (Join-Path ${env:ProgramFiles(x86)} "nodejs")
  }
  if ($env:AppData) {
    $candidateDirs += (Join-Path $env:AppData "npm")
  }

  foreach ($dir in $candidateDirs) {
    Add-DirToPathIfExists -Dir $dir | Out-Null
  }

  $npm = Get-Command npm -ErrorAction SilentlyContinue
  $npx = Get-Command npx -ErrorAction SilentlyContinue
  if ($npm -and $npx) { return }

  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if ($winget) {
    Write-Host "npm/npx not found. Installing Node.js LTS with winget..."
    winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements | Out-Host
    Refresh-PathFromSystem
    foreach ($dir in $candidateDirs) {
      Add-DirToPathIfExists -Dir $dir | Out-Null
    }
  }

  $npm = Get-Command npm -ErrorAction SilentlyContinue
  $npx = Get-Command npx -ErrorAction SilentlyContinue
  if (-not ($npm -and $npx)) {
    throw "npm/npx were not found after setup. Install Node.js LTS and retry."
  }
}

function Wait-ForBackend {
  param(
    [string]$Url,
    [int]$MaxAttempts = 30,
    [int]$DelaySeconds = 2
  )

  for ($i = 1; $i -le $MaxAttempts; $i++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Seconds $DelaySeconds
      continue
    }
    Start-Sleep -Seconds $DelaySeconds
  }
  return $false
}

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $rootDir "Main_backend"
$frontendDir = Join-Path $rootDir "Smart_Agriculture_Assistant-App"
$backendHealthUrl = "http://127.0.0.1:8000/api/weather/current/?lat=-29.85&lon=31.02"

$backendProcess = $null

try {
  Write-Host "Pipeline script version: $scriptVersion"
  Assert-Command "python"

  if (-not $SkipFrontend) {
    Ensure-NodeTooling
    $nodeVersion = (& node -v).Trim()
    Write-Host "Using npm: npm"
    Write-Host "Using npx: npx"
    Write-Host "Using node: $nodeVersion"
  }

  Write-Host ""
  Write-Host "[1/8] Backend dependencies"
  Push-Location $backendDir
  if (-not $SkipInstall) {
    python -m pip install -r requirements.txt
  }

  Write-Host ""
  Write-Host "[2/8] Backend migrate"
  python manage.py migrate

  Write-Host ""
  Write-Host "[3/8] Seed demo user + sample data"
  $demoUserCommand = @"
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from crop_logs.models import CropLog
from farm_records.models import FarmRecord
from market_prices.models import MarketPrice
from alerts.models import Alert

User = get_user_model()
username = 'demo_farmer'
password = 'Demo@12345'
email = 'demo_farmer@local.dev'
user, created = User.objects.get_or_create(username=username, defaults={'email': email})
user.email = email
user.is_active = True
user.set_password(password)
user.save()

today = date.today()

if CropLog.objects.filter(user=user).count() == 0:
    CropLog.objects.create(
        user=user,
        crop_name='Maize',
        variety='Pioneer 30Y87',
        planting_date=today - timedelta(days=45),
        expected_harvest_date=today + timedelta(days=75),
        status='growing',
        area_planted_hectares=2.4,
        notes='North field performing well.',
    )
    CropLog.objects.create(
        user=user,
        crop_name='Tomato',
        variety='Roma VF',
        planting_date=today - timedelta(days=28),
        expected_harvest_date=today + timedelta(days=35),
        status='growing',
        area_planted_hectares=0.8,
        notes='Monitor for early blight spots.',
    )

if FarmRecord.objects.filter(user=user).count() == 0:
    FarmRecord.objects.create(
        user=user,
        record_type='crop',
        activity_type='planting',
        date=today - timedelta(days=40),
        crop_name='Maize',
        crop_variety='Pioneer 30Y87',
        field_name='North Block',
        input_used='Compound Fertilizer',
        input_amount=50,
        input_unit='kg',
        notes='Initial planting complete.',
    )
    FarmRecord.objects.create(
        user=user,
        record_type='livestock',
        activity_type='feeding',
        date=today - timedelta(days=2),
        animal_id='TAG-1023',
        animal_type='Cattle',
        animal_age=24,
        animal_sex='F',
        weight_kg=410,
        input_used='Protein Mix',
        input_amount=12,
        input_unit='kg',
        notes='Increased intake due to colder weather.',
    )

if MarketPrice.objects.filter(user=user).count() == 0:
    MarketPrice.objects.create(
        user=user,
        commodity='Maize',
        price=5.85,
        unit='kg',
        market_location='Durban Fresh Market',
        trend='up',
        source='Local board',
        date=today,
        notes='Demand improving this week.',
    )
    MarketPrice.objects.create(
        user=user,
        commodity='Tomato',
        price=12.40,
        unit='kg',
        market_location='Pietermaritzburg Produce Hub',
        trend='stable',
        source='Trader report',
        date=today,
        notes='Supply and demand balanced.',
    )

if Alert.objects.filter(user=user).count() == 0:
    Alert.objects.create(
        user=user,
        title='Irrigation Reminder',
        message='Run drip irrigation in North Block before 17:00.',
        category='crop',
        severity='medium',
    )
    Alert.objects.create(
        user=user,
        title='Market Check',
        message='Review maize trend tomorrow morning for selling window.',
        category='market',
        severity='low',
    )

print('DEMO_USER_CREATED' if created else 'DEMO_USER_UPDATED')
print('DEMO_DATA_READY')
"@
  python manage.py shell -c $demoUserCommand

  Write-Host ""
  Write-Host "[4/8] Backend tests"
  python manage.py check
  python manage.py test
  Pop-Location

  Write-Host ""
  Write-Host "[5/8] Start backend"
  $backendProcess = Start-Process -FilePath "python" `
    -ArgumentList @("manage.py", "runserver", "127.0.0.1:8000") `
    -WorkingDirectory $backendDir `
    -WindowStyle Hidden `
    -PassThru

  $backendReady = Wait-ForBackend -Url $backendHealthUrl
  if (-not $backendReady) {
    throw "Backend failed health check at $backendHealthUrl"
  }
  Write-Host "Backend confirmed running on http://127.0.0.1:8000 (PID: $($backendProcess.Id))"

  if ($SkipFrontend) {
    Write-Host ""
    Write-Host "[6/8] Frontend steps skipped by -SkipFrontend."
    Write-Host "Backend is running and verified."
    return
  }

  Write-Host ""
  Write-Host "[6/8] Frontend dependencies"
  Push-Location $frontendDir
  if (-not $SkipInstall -or -not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    npm install
  }

  Write-Host ""
  Write-Host "[7/8] Frontend compatibility + tests"
  npx expo install --fix --npm
  npm run lint

  Write-Host ""
  Write-Host "[8/8] Start frontend"
  Write-Host "Pipeline checks passed. Starting Expo now..."
  Write-Host "When you stop Expo (Ctrl+C), backend will be stopped automatically."
  npm run start
}
finally {
  Set-Location $rootDir
  if ($backendProcess -and -not $backendProcess.HasExited) {
    Stop-Process -Id $backendProcess.Id -Force
    Write-Host "Backend process stopped."
  }
}
