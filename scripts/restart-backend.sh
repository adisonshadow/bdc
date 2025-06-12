#!/bin/bash

echo "重启后端服务..."
cd backend
pkill -f "yarn dev" || true
yarn dev 