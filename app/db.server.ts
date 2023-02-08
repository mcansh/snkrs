/* eslint-disable no-underscore-dangle */
import { PrismaClient } from "@prisma/client";
import invariant from "tiny-invariant";

invariant(process.env.DATABASE_URL, "DATABASE_URL is not defined");

declare global {
  // This prevents us from making multiple connections to the db when the
  // require cache is cleared.
  // eslint-disable-next-line vars-on-top, no-var
  var __db__: PrismaClient | undefined;
}

let prisma: PrismaClient;

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  prisma = getClient();
} else {
  if (!global.__db__) {
    global.__db__ = getClient();
  }
  prisma = global.__db__;
}

function getClient() {
  const databaseUrl = new URL(process.env.DATABASE_URL);

  const isLocalHost = databaseUrl.hostname === "localhost";

  const FLY_PRIMARY_REGION = isLocalHost
    ? null
    : process.env.FLY_PRIMARY_REGION;
  const FLY_REGION = isLocalHost ? null : process.env.FLY_REGION;

  const isReadReplicaRegion =
    !FLY_PRIMARY_REGION || FLY_PRIMARY_REGION === FLY_REGION;

  if (!isLocalHost) {
    databaseUrl.host = `${FLY_REGION}.${databaseUrl.host}`;
    if (!isReadReplicaRegion) {
      // 5433 is the read-replica port
      databaseUrl.port = "5433";
    }
  }

  // eslint-disable-next-line no-console
  console.log(`🔌 setting up prisma client to ${databaseUrl.host}`);
  // NOTE: during development if you change anything in this function, remember
  // that this only runs once per server restart and won't automatically be
  // re-run per request like everything else is. So if you need to change
  // something in this file, you'll need to manually restart the server.
  const client = new PrismaClient({
    datasources: {
      postgresql: {
        url: databaseUrl.toString(),
      },
    },
  });
  // connect eagerly
  void client.$connect();

  return client;
}

export { prisma };
