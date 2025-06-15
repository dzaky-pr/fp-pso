#!/bin/bash

echo "🚀 Setting up local DynamoDB for testing..."

# Create docker directory for DynamoDB data
mkdir -p docker/dynamodb

# Start DynamoDB Local
echo "📦 Starting DynamoDB Local container..."
docker-compose up -d dynamodb-local

# Wait for DynamoDB to be ready
echo "⏳ Waiting for DynamoDB Local to be ready..."
sleep 5

# Check if DynamoDB is running
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ DynamoDB Local is running on http://localhost:8000"
else
    echo "❌ Failed to start DynamoDB Local"
    exit 1
fi

# Hapus tabel 'books' jika sudah ada
echo "🧹 Deleting existing 'books' table (if any)..."
aws dynamodb delete-table --table-name books --endpoint-url http://localhost:8000 --region ap-southeast-1 --no-cli-pager > /dev/null 2>&1
sleep 2

# Create the books table
echo "📊 Creating 'books' table..."
aws dynamodb create-table \
    --table-name books \
    --attribute-definitions \
        AttributeName=id,AttributeType=N \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000 \
    --region ap-southeast-1 \
    --no-cli-pager

if [ $? -eq 0 ]; then
    echo "✅ Table 'books' created successfully!"
else
    echo "⚠️  Table might already exist or there was an error"
fi

# Add some sample data
echo "📝 Adding sample data..."
aws dynamodb put-item \
    --table-name books \
    --item '{
        "id": {"N": "1"},
        "title": {"S": "The Great Gatsby"},
        "author": {"S": "F. Scott Fitzgerald"},
        "price": {"N": "15.99"},
        "description": {"S": "A classic American novel set in the Jazz Age"},
        "isPrivate": {"BOOL": false},
        "ownerId": {"S": "user-1-system"}
    }' \
    --endpoint-url http://localhost:8000 \
    --region ap-southeast-1 \
    --no-cli-pager

aws dynamodb put-item \
    --table-name books \
    --item '{
        "id": {"N": "2"},
        "title": {"S": "To Kill a Mockingbird"},
        "author": {"S": "Harper Lee"},
        "price": {"N": "12.50"},
        "description": {"S": "A novel about racial injustice in the American South"},
        "isPrivate": {"BOOL": true},
        "ownerId": {"S": "user-1-system"}
    }' \
    --endpoint-url http://localhost:8000 \
    --region ap-southeast-1 \
    --no-cli-pager

aws dynamodb put-item \
    --table-name books \
    --item '{
        "id": {"N": "3"},
        "title": {"S": "1984"},
        "author": {"S": "George Orwell"},
        "price": {"N": "13.25"},
        "description": {"S": "A dystopian social science fiction novel"},
        "isPrivate": {"BOOL": false},
        "ownerId": {"S": "user-2-system"}
    }' \
    --endpoint-url http://localhost:8000 \
    --region ap-southeast-1 \
    --no-cli-pager

echo "✅ Sample data added!"

echo "🧹 Deleting existing 'users' table (if any)..."
aws dynamodb delete-table --table-name users --endpoint-url http://localhost:8000 --region ap-southeast-1 --no-cli-pager > /dev/null 2>&1
sleep 2

echo "📊 Creating 'users' table..."
aws dynamodb create-table \
    --table-name users \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=email,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --global-secondary-indexes "$(cat <<EOF
[
    {
        "IndexName": "EmailIndex",
        "KeySchema": [
            { "AttributeName": "email", "KeyType": "HASH" }
        ],
        "Projection": {
            "ProjectionType": "ALL"
        },
        "ProvisionedThroughput": {
            "ReadCapacityUnits": 1,
            "WriteCapacityUnits": 1
        }
    }
]
EOF
)" \
    --endpoint-url http://localhost:8000 \
    --region ap-southeast-1 \
    --no-cli-pager

if [ $? -eq 0 ]; then
    echo "✅ Table 'users' created successfully!"
else
    echo "⚠️  Table 'users' might already exist or there was an error"
fi

# Start DynamoDB Admin UI
echo "🎨 Starting DynamoDB Admin UI..."
docker-compose up -d dynamodb-admin

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📍 Services running:"
echo "   • DynamoDB Local: http://localhost:8000"
echo "   • DynamoDB Admin UI: http://localhost:8001"
echo ""
echo "🔧 To test the connection:"
echo "   aws dynamodb list-tables --endpoint-url http://localhost:8000 --region ap-southeast-1"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"