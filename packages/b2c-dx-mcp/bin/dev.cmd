@echo off

node --conditions development --import tsx "%~dp0\dev" %*

