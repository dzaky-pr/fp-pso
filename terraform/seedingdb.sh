#!/bin/bash

# Script untuk seeding database dengan user default
# Email: user@example.com
# Password: password123

echo "🌱 Starting database seeding..."

# Get table names from Terraform output
USERS_TABLE=$(terraform output -raw users_table_name 2>/dev/null || echo "users-46cc8894")
BOOKS_TABLE=$(terraform output -raw dynamodb_table_name 2>/dev/null || echo "books-46cc8894")

echo "📊 Using tables:"
echo "  - Users table: $USERS_TABLE"
echo "  - Books table: $BOOKS_TABLE"

# Wait for tables to be ready
echo "⏳ Waiting for tables to be ready..."
aws dynamodb wait table-exists --table-name "$USERS_TABLE" --region ap-southeast-1
aws dynamodb wait table-exists --table-name "$BOOKS_TABLE" --region ap-southeast-1

# Generate UUID for user
USER_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
CURRENT_TIME=$(date +%s000)  # Current time in milliseconds

# Pre-hashed password for "password123" (bcrypt hash with salt rounds=10)
# Generated with: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('password123', 10))"
PASSWORD_HASH='$2b$10$qiEoyGu83Eb8J/TR56eOYe4QGgpzN2Spd3K1HPbQ4us/c8N48gR.G'

echo "👤 Creating user: user@example.com"

# Delete any existing users with this email first
echo "🧹 Cleaning up any existing users with email: user@example.com"
EXISTING_USERS=$(aws dynamodb scan \
  --region ap-southeast-1 \
  --table-name "$USERS_TABLE" \
  --filter-expression "#email = :email" \
  --expression-attribute-names '{"#email": "email"}' \
  --expression-attribute-values '{":email": {"S": "user@example.com"}}' \
  --projection-expression "userId" \
  --output text --query 'Items[].userId.S')

for user_id in $EXISTING_USERS; do
  if [ ! -z "$user_id" ]; then
    echo "  Deleting user: $user_id"
    aws dynamodb delete-item \
      --region ap-southeast-1 \
      --table-name "$USERS_TABLE" \
      --key '{"userId": {"S": "'$user_id'"}}'
  fi
done

# Create user in DynamoDB
aws dynamodb put-item \
  --region ap-southeast-1 \
  --table-name "$USERS_TABLE" \
  --item '{
    "userId": {"S": "'$USER_ID'"},
    "email": {"S": "user@example.com"},
    "passwordHash": {"S": "'$PASSWORD_HASH'"},
    "createdAt": {"N": "'$CURRENT_TIME'"},
    "updatedAt": {"N": "'$CURRENT_TIME'"}
  }'

echo "📚 Creating sample books..."

# Clean up existing books for this user and create fresh ones
echo "🧹 Cleaning up existing books..."
EXISTING_BOOKS=$(aws dynamodb scan \
  --region ap-southeast-1 \
  --table-name "$BOOKS_TABLE" \
  --projection-expression "id" \
  --output text --query 'Items[].id.N')

for book_id in $EXISTING_BOOKS; do
  if [ ! -z "$book_id" ] && [ "$book_id" != "None" ]; then
    echo "  Deleting book: $book_id"
    aws dynamodb delete-item \
      --region ap-southeast-1 \
      --table-name "$BOOKS_TABLE" \
      --key '{"id": {"N": "'$book_id'"}}'
  fi
done

# Create some sample books
aws dynamodb put-item \
  --region ap-southeast-1 \
  --table-name "$BOOKS_TABLE" \
  --item '{
    "id": {"N": "1"},
    "title": {"S": "The Great Gatsby"},
    "author": {"S": "F. Scott Fitzgerald"},
    "description": {"S": "A classic American novel about the Jazz Age"},
    "price": {"N": "15.99"},
    "isPrivate": {"BOOL": false},
    "ownerId": {"S": "'$USER_ID'"}
  }'

aws dynamodb put-item \
  --region ap-southeast-1 \
  --table-name "$BOOKS_TABLE" \
  --item '{
    "id": {"N": "2"},
    "title": {"S": "To Kill a Mockingbird"},
    "author": {"S": "Harper Lee"},
    "description": {"S": "A novel about racial injustice and childhood in the American South"},
    "price": {"N": "12.99"},
    "isPrivate": {"BOOL": false},
    "ownerId": {"S": "'$USER_ID'"}
  }'

aws dynamodb put-item \
  --region ap-southeast-1 \
  --table-name "$BOOKS_TABLE" \
  --item '{
    "id": {"N": "3"},
    "title": {"S": "1984"},
    "author": {"S": "George Orwell"},
    "description": {"S": "A dystopian social science fiction novel"},
    "price": {"N": "14.50"},
    "isPrivate": {"BOOL": true},
    "ownerId": {"S": "'$USER_ID'"}
  }'

echo "✅ Database seeding completed successfully!"
echo ""
echo "📋 Created test data:"
echo "  👤 User: user@example.com"
echo "  🔐 Password: password123"
echo "  📚 Books: 3 sample books (2 public, 1 private)"
echo ""
echo "🧪 You can now test the application with these credentials."