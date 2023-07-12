# base node image
FROM node:16-bullseye-slim as base

# set for base and all that inherit from it
ENV NODE_ENV=production
ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA

# install openssl for prisma
RUN apt-get update && apt-get install -y openssl

###############################################################################

# install all node_modules, including dev dependencies
FROM base as deps

WORKDIR /myapp

ADD package.json package-lock.json .npmrc ./
RUN npm ci --production=false

###############################################################################

# setup production node_modules
FROM base as production-deps

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules
ADD package.json package-lock.json .npmrc ./
RUN npm prune --production

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

WORKDIR /myapp
# copy over production deps
COPY --from=production-deps /myapp/node_modules /myapp/node_modules
# copy over generated prisma client
COPY --from=build /myapp/node_modules/.prisma /myapp/node_modules/.prisma

# copy over built application and assets
COPY --from=build /myapp/build /myapp/build
COPY --from=build /myapp/public /myapp/public

# TODO: only copy output files, not everything
ADD . .

CMD ["sh", "scripts/start_with_migrations.sh"]
