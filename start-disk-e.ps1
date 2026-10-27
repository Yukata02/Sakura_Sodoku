$env:TEMP = "E:\temp"
$env:TMP = "E:\temp"
$env:npm_config_cache = "E:\.npm-cache"

if (-not (Test-Path "E:\temp")) { New-Item -ItemType Directory -Path "E:\temp" -Force | Out-Null }
if (-not (Test-Path "E:\.npm-cache")) { New-Item -ItemType Directory -Path "E:\.npm-cache" -Force | Out-Null }

npm start
