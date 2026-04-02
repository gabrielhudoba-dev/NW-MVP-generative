#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"
exec /opt/homebrew/bin/node node_modules/.bin/next dev -p "${PORT:-3000}"
