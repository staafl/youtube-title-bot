@echo off
setlocal

del *.zip
call 7z a youtube-title-bot.zip . -x!.git
call az webapp deployment source config-zip --resource-group "default" --src "youtube-title-bot.zip" --name youtube-video-title