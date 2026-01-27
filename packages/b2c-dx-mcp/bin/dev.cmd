@echo off

@REM Set NODE_ENV to development if not already set (disables production telemetry)
if not defined NODE_ENV set NODE_ENV=development

node --conditions development --import tsx "%~dp0\dev" %*

