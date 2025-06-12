#!/bin/bash

echo "重启前端服务..."
cd frontend
sudo pkill -f "yarn dev" || true
sudo yarn dev 