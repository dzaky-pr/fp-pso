# Local Database Setup untuk Testing

Dokumen ini menjelaskan cara setup database lokal untuk testing aplikasi Book Library.

## Prerequisites

- Docker dan Docker Compose terinstall
- AWS CLI terinstall
- Node.js dan npm/pnpm

## Setup Database Lokal

### 1. Setup Otomatis (Rekomendasi)

```bash
# Setup database lokal dengan Docker
npm run db:setup
```

Script ini akan:

- Menjalankan DynamoDB Local di port 8000
- Menjalankan DynamoDB Admin UI di port 8001
- Membuat tabel 'books'
- Menambahkan sample data

### 2. Setup Manual

```bash
# 1. Start DynamoDB Local
docker-compose up -d dynamodb-local

# 2. Buat tabel books
aws dynamodb create-table \
    --table-name books \
    --attribute-definitions AttributeName=id,AttributeType=N \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000 \
    --region ap-southeast-1

# 3. Buat tabel users
aws dynamodb create-table \
    --table-name users \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=email,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --global-secondary-indexes '[ \
        { \
            "IndexName": "EmailIndex", \
            "KeySchema": [ \
                { "AttributeName": "email", "KeyType": "HASH" } \
            ], \
            "Projection": { \
                "ProjectionType": "ALL" \
            }, \
            "ProvisionedThroughput": { \
                "ReadCapacityUnits": 1, \
                "WriteCapacityUnits": 1 \
            } \
        } \
    ]' \
    --endpoint-url http://localhost:8000 \
    --region ap-southeast-1 \
    --no-cli-pager

# 4. Start Admin UI
docker-compose up -d dynamodb-admin
```

## Testing Database Connection

### Test dengan Node.js

```bash
npm run db:test
```

### Test dengan AWS CLI

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region ap-southeast-1
```

### Test dengan Admin UI

Buka http://localhost:8001 di browser untuk melihat data secara visual.

## Menjalankan Tests

### Test Unit dengan Database Lokal

```bash
# Set environment untuk testing
cp .env.test .env.local

# Jalankan tests
npm run test:local
```

### Test Manual API

```bash
# Test connection
node local-lambda.js

# Test CRUD operations
node -e "
const { getAllBooks, putBook, getBook } = require('./local-lambda.js');
(async () => {
  console.log('Books:', await getAllBooks());
})();
"
```

## Environment Variables untuk Testing

Buat file `.env.local` dengan:

```bash
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
TABLE_NAME=books
NEXT_PUBLIC_LOCAL_DEV=true
```

## Commands Berguna

```bash
# Start semua services
npm run db:start

# Stop semua services
npm run db:stop

# Setup ulang database
npm run db:setup

# Test connection
npm run db:test

# Run tests dengan local DB
npm run test:local
```

## Troubleshooting

### DynamoDB tidak bisa connect

1. Pastikan Docker berjalan
2. Check port 8000 tidak digunakan aplikasi lain
3. Restart containers: `npm run db:stop && npm run db:start`

### Table tidak ada

```bash
# Cek tables yang ada
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region ap-southeast-1

# Buat ulang table
aws dynamodb create-table \
    --table-name books \
    --attribute-definitions AttributeName=id,AttributeType=N \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000 \
    --region ap-southeast-1
```

### Permission denied pada script

```bash
chmod +x setup-local-db.sh
```

## URL Services

- **DynamoDB Local**: http://localhost:8000
- **DynamoDB Admin UI**: http://localhost:8001
- **Next.js App**: http://localhost:3000

## Data Persistence

Data DynamoDB disimpan di `./docker/dynamodb/` sehingga data tidak hilang saat restart container.
