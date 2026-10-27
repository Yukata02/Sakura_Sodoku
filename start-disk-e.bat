@echo off
set TEMP=E:\temp
set TMP=E:\temp
set npm_config_cache=E:\.npm-cache
if not exist "E:\temp" mkdir "E:\temp"
if not exist "E:\.npm-cache" mkdir "E:\.npm-cache"
npm start
