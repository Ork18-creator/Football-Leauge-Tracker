param(
  [int]$DebounceSeconds = 8,
  [string]$Branch = "main",
  [switch]$Once
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$gitPath = "C:\Users\omkes\AppData\Local\GitHubDesktop\app-3.5.6\resources\app\git\cmd\git.exe"
$pushLogPath = Join-Path $repoRoot "push-log.csv"

if (-not (Test-Path $gitPath)) {
  throw "Git executable not found at '$gitPath'. Update scripts/auto-push.ps1 with the correct git path."
}

function Invoke-Git {
  param([string[]]$GitArgs)

  $output = & $gitPath -C $repoRoot @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "git command failed: $($GitArgs -join ' ')"
  }

  return $output
}

function Get-WorktreeChanges {
  $status = Invoke-Git -GitArgs @("status", "--porcelain")
  if (-not $status) {
    return @()
  }

  return @($status | Where-Object { $_ -and $_.Trim() -ne "" })
}

function Ensure-PushLog {
  if (Test-Path $pushLogPath) {
    return
  }

  "Date,Time,Branch,Commit,Message" | Set-Content -Path $pushLogPath -Encoding ASCII
}

function Add-PushLogEntry {
  param(
    [string]$BranchName,
    [string]$CommitHash,
    [string]$CommitMessage
  )

  Ensure-PushLog

  $now = Get-Date
  $entry = [PSCustomObject]@{
    Date = $now.ToString("yyyy-MM-dd")
    Time = $now.ToString("HH:mm:ss")
    Branch = $BranchName
    Commit = $CommitHash
    Message = $CommitMessage
  }

  $entry | Export-Csv -Path $pushLogPath -NoTypeInformation -Append
}

function Publish-Changes {
  $changes = Get-WorktreeChanges
  if ($changes.Count -eq 0) {
    Write-Host "No changes to push."
    return
  }

  Invoke-Git -GitArgs @("add", "-A") | Out-Null

  $postAddChanges = Get-WorktreeChanges
  if ($postAddChanges.Count -eq 0) {
    Write-Host "No stageable changes found."
    return
  }

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $message = "Auto-sync: $timestamp"

  try {
    Invoke-Git -GitArgs @("commit", "-m", $message) | Out-Null
    $commitHash = (& $gitPath -C $repoRoot rev-parse --short HEAD 2>$null | Select-Object -First 1).Trim()
    Add-PushLogEntry -BranchName $Branch -CommitHash $commitHash -CommitMessage $message
    Invoke-Git -GitArgs @("add", "push-log.csv") | Out-Null
    Invoke-Git -GitArgs @("commit", "--amend", "--no-edit") | Out-Null
    Invoke-Git -GitArgs @("push", "origin", $Branch) | Out-Null
    Write-Host "Pushed changes at $timestamp"
  } catch {
    Write-Warning "Auto-push failed: $($_.Exception.Message)"
  }
}

if ($Once) {
  Publish-Changes
  exit 0
}

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $repoRoot
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]'FileName, LastWrite, DirectoryName, Size'

$ignoredPathFragments = @(
  "\.git\",
  "\node_modules\",
  "\dist\"
)

$script:lastChangeAt = Get-Date
$script:pending = $false

$onChange = {
  $fullPath = $Event.SourceEventArgs.FullPath

  foreach ($fragment in $ignoredPathFragments) {
    if ($fullPath -like "*$fragment*") {
      return
    }
  }

  $script:lastChangeAt = Get-Date
  $script:pending = $true
}

$subscriptions = @(
  Register-ObjectEvent $watcher Changed -Action $onChange,
  Register-ObjectEvent $watcher Created -Action $onChange,
  Register-ObjectEvent $watcher Deleted -Action $onChange,
  Register-ObjectEvent $watcher Renamed -Action $onChange
)

Write-Host "Watching $repoRoot"
Write-Host "Auto-push is active. Press Ctrl+C to stop."

try {
  while ($true) {
    Start-Sleep -Seconds 2

    if (-not $script:pending) {
      continue
    }

    $secondsSinceLastChange = ((Get-Date) - $script:lastChangeAt).TotalSeconds
    if ($secondsSinceLastChange -lt $DebounceSeconds) {
      continue
    }

    $script:pending = $false
    Publish-Changes
  }
} finally {
  foreach ($subscription in $subscriptions) {
    Unregister-Event -SourceIdentifier $subscription.Name -ErrorAction SilentlyContinue
    $subscription | Remove-Job -Force -ErrorAction SilentlyContinue
  }

  $watcher.Dispose()
}
