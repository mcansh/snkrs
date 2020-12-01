const express = require('express');
const { createRequestHandler } = require('@remix-run/express');
const session = require('express-session');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(
  session({
    secret: 'whatever',
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000, // 1 week
    },
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, // 2 minutes
      dbRecordIdIsSessionId: true,
    }),
  })
);

app.all(
  '*',
  createRequestHandler({
    enableSessions: false,
    getLoadContext() {
      return { prisma };
    },
  })
);

module.exports = app;
