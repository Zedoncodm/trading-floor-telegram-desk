$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "Trading Floor Desk.lnk"
$TargetBat = Join-Path $RepoRoot "Launch-Trading-Desk.bat"
$IconPath = Join-Path $RepoRoot "assets\trading-desk.ico"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetBat
$Shortcut.WorkingDirectory = $RepoRoot
$Shortcut.Description = "Lancer Trading Floor Desk (100% Local)"
if (Test-Path $IconPath) {
  $Shortcut.IconLocation = "$IconPath,0"
}
$Shortcut.WindowStyle = 7
$Shortcut.Save()

Write-Output "Raccourci Bureau cree : $ShortcutPath"
