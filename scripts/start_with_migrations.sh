#!/bin/sh

set -ex

npx prisma migrate deploy

node ./setup-litestream.js

# npm run start
# Start litestream and the main application
litestream replicate -exec "npm run start"
