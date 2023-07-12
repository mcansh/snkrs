import { PrismaClient } from "@prisma/client";

import { singleton } from "./lib/singleton";

export let prisma = singleton("prisma", () => new PrismaClient());
