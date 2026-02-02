@echo off

@REM Disable telemetry in development mode to avoid polluting production data
if not defined SFCC_DISABLE_TELEMETRY set SFCC_DISABLE_TELEMETRY=true

node --import tsx "%~dp0\dev" %*
