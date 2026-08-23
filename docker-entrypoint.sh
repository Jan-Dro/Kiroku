#!/bin/sh
set -eu

mkdir -p /app/data/uploads
chown -R kiroku:kiroku /app/data

gosu kiroku npm run db:migrate:deploy
exec gosu kiroku "$@"
