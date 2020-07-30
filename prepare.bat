@echo off
setlocal

call az login
call az deployment group create --resource-group "default" --template-file "deploymentTemplates/template-with-preexisting-rg.json" --parameters "@deploymentTemplates/preexisting-rg-parameters.json" --name "youtube-video-title" 
