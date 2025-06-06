#!/bin/bash
cd /home/kavia/workspace/code-generation/cinequest-35280-48ad1f99/cinequest_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

