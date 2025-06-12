# Book Library (CRUD App) - Final Project PSO

A comprehensive Book Library application built using **Next.js 14**, **Tailwind CSS**, **AWS DynamoDB**, **AWS Lambda**, **AWS API Gateway**, **AWS SNS**, **AWS CloudWatch**, and **Terraform**. This project demonstrates modern full-stack development with cloud infrastructure, automated monitoring, notifications, and comprehensive CI/CD pipelines.

## 🚀 Quick Start Guide

### Step-by-Step Setup

#### Setup Awal

1. **Dapatkan Access Key & Secret Key AWS**

   - Bisa menggunakan Root account atau IAM Account
   - Untuk IAM Account, tambahkan template IAM Policy (lihat bagian [GitHub Secrets](#setup-github-secrets-untuk-cicd))

2. **Download dan Install AWS CLI & Terraform**

   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Install Terraform (macOS)
   brew install terraform
   ```

3. **Konfigurasi AWS CLI**
   ```bash
   aws configure
   # Masukkan Access Key, Secret Access Key, dan Default Region (ap-southeast-1)
   ```

#### Setup Infrastructure

1. **Clone dan Setup Project**

   ```bash
   git clone <repository-url>
   cd fp-pso
   npm install
   ```

2. **Deploy Infrastructure**

   ```bash
   # Option A: Automated (Recommended)
   chmod +x ./setup_terraform_env.sh
   ./setup_terraform_env.sh

   cd terraform
   terraform init
   terraform apply --auto-approve

   # Option B: Manual
   cd terraform
   terraform init
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars dengan KEY_PAIR_NAME dan VPC_ID Anda
   terraform apply --auto-approve
   ```

3. **Copy AWS API URL untuk Environment**

   ```bash
   # Copy output dari terraform
   terraform output api_gateway_url

   # Tambahkan ke .env.local
   echo "AWS_API_URL=https://your-api-url" >> .env.local
   ```

#### Setup GitHub Secrets (untuk CI/CD)

Tambahkan secrets berikut ke GitHub repository (`Settings > Secrets and variables > Actions`):

- `AWS_ACCESS_KEY_ID` - AWS Access Key ID
- `AWS_SECRET_ACCESS_KEY` - AWS Secret Access Key
- `EC2_SSH_KEY` - Content dari file .pem key pair
- `KEY_PAIR_NAME` - Nama EC2 key pair yang digunakan
- `VPC_ID` - VPC ID yang digunakan

## 📚 Dokumentasi Lengkap

Untuk dokumentasi yang lebih komprehensif, termasuk analisis mendalam, screenshot aplikasi, dan penjelasan teknis detail, silakan kunjungi:

**📖 [Dokumentasi Lengkap Final Project PSO](https://docs.google.com/document/d/1FM59DOMKKOHV8CSNSFFZABPD7N28QC_dYh5sKlfDaUs/edit?usp=sharing)**

Dokumentasi tersebut mencakup:

- 📸 Screenshots dan demo aplikasi
- 🔍 Analisis arsitektur sistem secara detail
- 🚀 Penjelasan implementasi CI/CD pipeline
- 📊 Evaluasi performa dan monitoring
- 🎯 Kesimpulan dan pembelajaran dari project

## 🎯 Project Overview

Aplikasi Book Library dengan fitur CRUD lengkap yang menggunakan:

- **Frontend**: Next.js 14 dengan TypeScript dan Tailwind CSS
- **Backend**: AWS Lambda dengan API Gateway untuk REST API
- **Database**: AWS DynamoDB untuk penyimpanan data
- **Infrastructure**: Terraform untuk Infrastructure as Code
- **DevOps**: GitHub Actions untuk CI/CD pipeline otomatis
- **Testing**: Jest untuk unit testing, Playwright untuk E2E testing
- **Code Quality**: Biome untuk formatting/linting, Husky untuk Git hooks

## 🚀 Features

- **CRUD Operations**: Complete Create, Read, Update, Delete functionality for books
- **Responsive Design**: Modern UI dengan Tailwind CSS dan dark mode support
- **Real-time Search**: Client-side search functionality
- **Serverless Architecture**: AWS Lambda functions untuk scalable backend
- **Infrastructure as Code**: AWS infrastructure managed dengan Terraform
- **CI/CD Pipeline**: Automated testing, building, dan deployment
- **Local Development**: Docker-based local DynamoDB untuk development

## 🏗️ Architecture

```
Frontend (Next.js) ↔ API Gateway ↔ AWS Lambda ↔ DynamoDB
                                   ↓
                             CloudWatch Logs
```

**Tech Stack:**

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React Icons
- **Backend**: AWS Lambda (Node.js 18.x), API Gateway, DynamoDB
- **Infrastructure**: Terraform, GitHub Actions, Docker, S3, CloudWatch, SNS
- **Monitoring**: CloudWatch Logs, CloudWatch Alarms, SNS Notifications
- **Deployment**: EC2 instances (staging/production), S3 artifact storage

## 📋 Prerequisites

- **Node.js 18+** dan npm
- **Docker & Docker Compose** untuk local development
- **AWS Account** dengan appropriate permissions
- **AWS CLI** dan **Terraform** installed
- **Git** untuk version control

## 🚀 Local Development

### Quick Setup

```bash
# Clone dan install dependencies
git clone <repository-url>
cd fp-pso
npm install

# Setup local DynamoDB dengan Docker
npm run db:setup

# Start development server dengan local API
npm run dev:full
```

### Access URLs

- **Next.js App**: http://localhost:3000
- **Local API**: http://localhost:3001
- **DynamoDB Admin UI**: http://localhost:8001
- **DynamoDB Local**: http://localhost:8000

### Manual Setup (Alternative)

```bash
# Start local DynamoDB
npm run db:start

# In another terminal, start local API server
npm run api:start

# In another terminal, start Next.js development server
npm run dev
```

## ☁️ AWS Infrastructure Setup

### Setup Awal

1. **Dapatkan Access Key & Secret Key AWS**

   - Bisa menggunakan Root account atau IAM Account
   - Tambahkan template IAM Policy jika by IAM Account

2. **Bikin VPC untuk Instance EC2 atau pake Default VPC**

3. **Bikin Key Pair untuk Instance EC2**

4. **Download AWS CLI & Terraform**

   ```bash
   # macOS
   brew install awscli terraform

   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip && sudo ./aws/install
   ```

5. **aws configure buat set Access Key, Secret Access Key, sama Default Region**
   ```bash
   aws configure
   # Access Key ID: AKIA...
   # Secret Access Key: ...
   # Default region: ap-southeast-1
   # Default output: json
   ```

### Setup Infrastructure

```bash
# Navigate ke terraform directory
cd terraform

# Initialize terraform
terraform init

# Apply infrastructure (auto-approve)
terraform apply --auto-approve

# Copy aws_api_url buat ditambahin ke env
terraform output api_gateway_url
echo "AWS_API_URL=https://your-api-url" >> .env.local
```

### Setup GitHub Secrets

Tambahin secrets ini ke GitHub repository (`Settings > Secrets and variables > Actions`):

- `AWS_ACCESS_KEY_ID` - Your AWS Access Key ID
- `AWS_SECRET_ACCESS_KEY` - Your AWS Secret Access Key
- `EC2_SSH_KEY` - Content dari .pem key pair file
- `KEY_PAIR_NAME` - Nama EC2 key pair
- `VPC_ID` - VPC ID yang dipake

## ☁️ AWS Services yang Digunakan

Project ini menggunakan berbagai AWS services untuk menciptakan arsitektur cloud yang scalable dan reliable:

### Core Services

- **🗄️ DynamoDB** - NoSQL database untuk menyimpan data books dengan auto-scaling
- **⚡ Lambda** - Serverless compute untuk API backend (Node.js 18.x)
- **🌐 API Gateway** - HTTP API untuk routing requests ke Lambda functions
- **🪣 S3** - Object storage untuk artifacts, deployment packages, dan static files
- **🖥️ EC2** - Virtual machines untuk staging dan production environments

### Monitoring & Alerting

- **📊 CloudWatch Logs** - Centralized logging untuk Lambda dan API Gateway
- **⚠️ CloudWatch Alarms** - Monitoring untuk Lambda errors dan EC2 health checks
- **📧 SNS** - Email notifications untuk alerts dan system events
- **📈 CloudWatch Metrics** - Performance monitoring dan custom metrics

### Security & Access

- **🔑 IAM Roles** - Fine-grained permissions untuk services
- **🔐 IAM Users** - Dedicated users untuk CI/CD pipelines
- **🛡️ Security Groups** - Network security untuk EC2 instances
- **🗝️ EC2 Key Pairs** - SSH access untuk server management

### Infrastructure Management

- **📋 Terraform State** - Remote state storage di S3 dengan encryption
- **🏗️ Infrastructure as Code** - Semua resources managed via Terraform
- **🔄 Versioning** - S3 bucket versioning untuk artifact management

## 🧪 Testing & Development

```bash
# Local Development
npm run dev:full         # Start local dev dengan database
npm run db:setup         # Setup local DynamoDB
npm run db:start         # Start DynamoDB containers
npm run db:stop          # Stop DynamoDB containers

# Testing
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run smoke            # Run E2E tests dengan Playwright (darkmode + smoke tests)

# Code Quality
npm run lint             # Lint dengan Biome
npm run format           # Format code
npm run typecheck        # TypeScript checking
```

## 🚀 Deployment & CI/CD

Project ini sudah dilengkapi CI/CD pipeline otomatis via GitHub Actions:

- **CI Pipeline**: Runs on push ke main branch - testing, building, upload artifacts
- **CD Pipeline**: Deploy ke staging dan production EC2 instances

### Manual Deployment

```bash
npm run build
cd terraform && terraform apply
terraform output api_gateway_url  # Copy ke .env.local
```

## 🔧 Common Issues & Troubleshooting

1. **Terraform gagal**: `aws sts get-caller-identity` → check credentials
2. **EC2 tidak bisa diakses**: Check security groups dan SSH key
3. **Lambda error**: Check CloudWatch logs
4. **API tidak respond**: Test endpoint dengan curl
5. **GitHub Actions gagal**: Verify semua secrets set dengan benar

## 📄 API Endpoints

| Method | Endpoint      | Description        |
| ------ | ------------- | ------------------ |
| GET    | `/books`      | Get all books      |
| GET    | `/books/{id}` | Get book by ID     |
| PUT    | `/books`      | Create/Update book |
| DELETE | `/books/{id}` | Delete book        |

## 👥 Team Members

| NRP        | Name                      |
| ---------- | ------------------------- |
| 5026221085 | Dzaky Purnomo Rifa'i      |
| 5026221086 | Darrell Valentino Widjaja |
| 5026221089 | Frans Nicklaus Gusyanto   |
| 5026221096 | Viera Tito Virgiawan      |

## 📄 License

This project is open source and available under the [MIT License](./LICENCE).

---

**Book Library Final Project PSO** - Modern full-stack development dengan AWS cloud infrastructure.
