/* eslint-disable no-console */
let fs = require('fs');

let { PrismaClient } = require('@prisma/client');

let client = new PrismaClient();

if (process.env.FLY_REGION === process.env.FLY_PRIMARY_REGION) {
  console.log('COPYING PRIMARY LITESTREAM CONFIG');
  fs.copyFileSync('/etc/litestream.primary.yml', '/etc/litestream.yml');
} else {
  console.log('COPYING REPLICA LITESTREAM CONFIG');
  fs.copyFileSync('/etc/litestream.replica.yml', '/etc/litestream.yml');
}

client.$queryRaw`PRAGMA journal_mode = WAL;`
  .then(() => {
    console.log('ENABLED WAL MODE FOR DATABASE');
  })
  .catch(err => {
    console.log('DB SETUP FAILED', err);
    process.exit(1);
  });
