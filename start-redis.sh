#!/usr/bin/env bash

export HOMEBREW_PATH=$(brew --prefix)

if [ -z "$HOMEBREW_PATH" ]; then
  echo "Homebrew not installed"
  exit 1
fi

export REDIS_PATH="$HOMEBREW_PATH/etc/redis.conf"

if [ -z "$REDIS_PATH" ]; then
  echo "Redis not installed"
  exit 1
fi

redis-server $REDIS_PATH
