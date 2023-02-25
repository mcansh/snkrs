# base node image
FROM node:16-bullseye-slim as base

# set for base and all that inherit from it
ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA

# install openssl for prisma
RUN apt-get update && apt-get install -y openssl

RUN corepack enable

###############################################################################

# install all node_modules, including dev dependencies
FROM base as deps

WORKDIR /myapp

ADD package.json pnpm-lock.yaml .npmrc ./
ADD ./patches ./patches
RUN npm pkg delete scripts.prepare
RUN pnpm install --frozen-lockfile

###############################################################################

# setup production node_modules
FROM base as production-deps

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules
ADD package.json pnpm-lock.yaml .npmrc ./
ADD ./patches ./patches
RUN npm pkg delete scripts.prepare
RUN pnpm prune --prod

###############################################################################

# build the app
FROM base as build

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules

ADD prisma .
RUN npx prisma generate

ADD . .
RUN npm run build

###############################################################################

# finally, build the production image with minimal footprint
FROM base

ENV NODE_ENV=production

WORKDIR /myapp
# copy over production deps
COPY --from=production-deps /myapp/node_modules /myapp/node_modules
# copy over generated prisma client
COPY --from=build /myapp//node_modules/.pnpm/@prisma+client@4.10.1_prisma@4.10.1/node_modules/@prisma/client /myapp//node_modules/.pnpm/@prisma+client@4.10.1_prisma@4.10.1/node_modules/@prisma/client

# copy over built application and assets
COPY --from=build /myapp/build /myapp/build
COPY --from=build /myapp/public /myapp/public

ADD ./scripts/start_with_migrations.sh ./scripts/start_with_migrations.sh

ENTRYPOINT [ "scripts/start_with_migrations.sh" ]
