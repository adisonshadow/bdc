#!/bin/bash
set -e

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../sqls/init_schema.sql" 