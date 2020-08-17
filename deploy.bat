@echo off
setlocal
for /f %%x in ('dir /b *.js') do (
    call node --check %%x
    if ERRORLEVEL 1 exit /b
)
del *.zip
call git commit -am "deploy"
call npm version patch
call git push
copy .env-ytb .env /y
call 7z a youtube-title-bot.zip . -x!.git
call az webapp deployment source config-zip --resource-group "default" --src "youtube-title-bot.zip" --name youtube-video-title
copy .env-clean .env /y