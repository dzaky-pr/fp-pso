#!/bin/bash
echo "Seeding DynamoDB data..."

# Tunggu sampai table ready
aws dynamodb wait table-exists --table-name BookLibrary-Users

# Insert users
aws dynamodb put-item \
  --table-name BookLibrary-Users \
  --item file://data/user1.json

aws dynamodb put-item \
  --table-name BookLibrary-Users \
  --item file://data/user2.json

echo "Data seeding completed!"