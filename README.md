# Book Library (CRUD App) - Final Project PSO

A comprehensive Book Library application built using **Next.js 14**, **Tailwind CSS**, **AWS DynamoDB**, **AWS Lambda**, **AWS API Gateway**, **AWS SNS**, **AWS CloudWatch**, **AWS S3**, **AWS EC2**, **AWS VPC**, **AWS IAM**, and **Terraform**. This project demonstrates modern full-stack development with cloud infrastructure, automated monitoring, notifications, and comprehensive CI/CD pipelines.

## 🚀 Complete Setup Guide from Scratch

### Prerequisites & Tools Installation

#### 1. Install Required Tools

**Node.js & npm:**

- Download from: https://nodejs.org/ (v18+ required)
- Alternative: Use `nvm` (Node Version Manager)
  ```bash
  # Install nvm
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  # Install Node.js 18
  nvm install 18
  nvm use 18
  ```

**AWS CLI:**

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows
# Download from: https://aws.amazon.com/cli/
```

**Terraform:**

```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_linux_amd64.zip
unzip terraform_1.6.6_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Windows
# Download from: https://www.terraform.io/downloads
```

**Docker & Docker Compose:**

```bash
# macOS
brew install docker docker-compose

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install docker.io docker-compose

# Or download Docker Desktop from: https://www.docker.com/products/docker-desktop/
```

**Git:**

```bash
# macOS
brew install git

# Linux
sudo apt install git

# Windows - Download from: https://git-scm.com/
```

#### 2. AWS Account Setup

**Create AWS Account:**

1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the registration process
4. Add payment method (free tier available)

**Get AWS Credentials (Choose one):**

**Option A: Root User (Not Recommended for Production)**

1. Login to AWS Console
2. Go to IAM → Users → Security credentials
3. Create Access Key
4. Save Access Key ID and Secret Access Key

**Option B: IAM User (Recommended)**

1. Login to AWS Console as root
2. Go to IAM → Users → Create User
3. Add user with programmatic access
4. Attach policy using the template from `terraform/iam-policy-template.json`
5. Save Access Key ID and Secret Access Key

#### 3. AWS Infrastructure Preparation

**Create EC2 Key Pair:**

1. Go to AWS Console → EC2 → Key Pairs
2. Click "Create key pair"
3. Name: `book-library-key` (or your preferred name)
4. Type: RSA, Format: .pem
5. Download and save the .pem file securely

**Configure AWS CLI:**

```bash
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Access Key]
# Default region name: ap-southeast-1
# Default output format: json
```

**Verify AWS Configuration:**

```bash
aws sts get-caller-identity
# Should return your AWS account details
```

### Project Setup

#### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/fp-pso.git
cd fp-pso

# Install dependencies
npm install
```

#### 2. Configure Terraform Variables

```bash
# Navigate to terraform directory
cd terraform

# Copy example terraform variables
cp terraform.example.tfvars terraform.tfvars

# Edit terraform.tfvars with your values
nano terraform.tfvars
```

**Edit `terraform.tfvars` with your specific values:**

```hcl
# Required: Your EC2 Key Pair name
key_pair_name = "book-library-key"

# Required: Change this JWT secret
jwt_secret = "your-super-secret-jwt-key-min-32-chars"

# Required: Your alert email
alert_emails = [
  "your-email@example.com"
]

# Optional: Keep defaults or customize
aws_region = "ap-southeast-1"
environment = "development"
project_name = "book-library"
```

#### 3. Deploy AWS Infrastructure

```bash
# Initialize Terraform (run from terraform directory)
terraform init

# Plan deployment (optional, to see what will be created)
terraform plan

# Deploy infrastructure
terraform apply
# Type 'yes' when prompted
```

**Wait for deployment to complete (5-10 minutes)**

#### 4. Get API Gateway URL

```bash
# Get the API Gateway URL
terraform output api_gateway_url

# Create .env.local file in project root
cd ..
echo "AWS_API_URL=<your-api-gateway-url>" > .env.local
```

### GitHub CI/CD Setup

#### 1. Fork/Import Repository to GitHub

1. Go to GitHub and create a new repository or fork this one
2. Push your code to GitHub:
   ```bash
   git remote set-url origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

#### 2. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

**Add these Repository Secrets:**

| Secret Name             | Value                             | Description                        |
| ----------------------- | --------------------------------- | ---------------------------------- |
| `AWS_ACCESS_KEY_ID`     | Your AWS Access Key ID            | For AWS authentication             |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Access Key        | For AWS authentication             |
| `EC2_SSH_KEY`           | Content of your .pem key file     | For SSH access to EC2 instances    |
| `SONARCLOUD_TOKEN`      | Content of your sonarcloud token  | For code quality check             |
| `JWT_SECRET`            | Your application's JWT secret key | Used for signing and verifying JWT |

**How to get EC2_SSH_KEY value:**

```bash
# Copy the entire content of your .pem file
cat /path/to/your/book-library-key.pem
# Copy the output including -----BEGIN RSA PRIVATE KEY----- and -----END RSA PRIVATE KEY-----
```

**⚠️ Important Notes:**

- **VPC_ID and KEY_PAIR_NAME are NOT needed** as GitHub secrets because Terraform creates and manages these resources
- Only the 3 secrets above are required for the CI/CD pipeline to work
- The CI/CD pipeline uses IAM users created by Terraform for deployment, not your main AWS credentials

### Local Development Setup

#### 1. Setup Local Environment

```bash
# Start local DynamoDB with Docker
npm run db:setup

# Alternative: Manual setup
npm run db:start
```

#### 2. Test Local Development

```bash
# Start full development environment
npm run dev:full

# Or start services separately:
# Terminal 1: Start local API
npm run api:start

# Terminal 2: Start Next.js dev server
npm run dev
```

#### 3. Access Local URLs

- **Next.js App**: http://localhost:3000
- **Local API**: http://localhost:3001
- **DynamoDB Admin**: http://localhost:8001
- **DynamoDB Local**: http://localhost:8000

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests with Playwright
npm run smoke

# Run tests with coverage
npm run test:coverage
```

### Deployment & Monitoring

#### Automatic Deployment

- **CI Pipeline**: Triggers on push to main branch
- **CD Pipeline**: Auto-deploys to staging and production EC2 instances
- **Monitoring**: CloudWatch logs and SNS alerts configured

#### Manual Deployment

```bash
# Build and deploy
npm run build
cd terraform && terraform apply

# Check deployment
curl -X GET https://your-api-gateway-url/books
```

### Troubleshooting

**Common Issues:**

1. **Terraform fails with permission denied**

   ```bash
   # Check AWS credentials
   aws sts get-caller-identity

   # Verify IAM permissions match template
   ```

2. **EC2 instances not accessible**

   - Check Security Groups in AWS Console
   - Verify SSH key pair exists and is correct
   - Ensure your IP is allowed in security group

3. **Lambda functions returning errors**

   - Check CloudWatch Logs in AWS Console
   - Verify environment variables are set
   - Check API Gateway configuration

4. **GitHub Actions failing**

   - Verify all 3 required secrets are set correctly
   - Check Actions logs for specific error messages
   - Ensure AWS credentials have sufficient permissions

5. **Local development issues**
   ```bash
   # Reset local environment
   npm run db:stop
   docker system prune -f
   npm run db:setup
   ```

**Getting Help:**

- Check CloudWatch Logs for AWS-related issues
- Review GitHub Actions logs for CI/CD issues
- Use `terraform plan` to preview changes before applying
- Test API endpoints with curl or Postman

## 📚 Complete Documentation

For comprehensive documentation including in-depth analysis, application screenshots, and detailed technical explanations, visit:

**📖 [Complete Final Project PSO Documentation](https://docs.google.com/document/d/1FM59DOMKKOHV8CSNSFFZABPD7N28QC_dYh5sKlfDaUs/edit?usp=sharing)**

The documentation includes:

- 📚 Project Overview – Introduction to the Book Library app, its features, and team members
- 🔗 Repository Link – GitHub project repository and collaboration setup
- 🧰 Technology Stack – Tools and platforms used (Next.js, AWS, GitHub Actions, etc.)
- 🛠️ Tool Installation & Setup – How to install AWS CLI, Node.js, Terraform, and npm packages
- 🌐 Environment Setup – Initial repo setup, dependency install, .env config, and local dev server
- ☁️ AWS Services Configuration – Manual setup for Lambda, DynamoDB, API Gateway, S3, and IAM
- 📦 Infrastructure as Code (Terraform) – Automated resource provisioning and configuration
- ⚙️ CI Pipeline (GitHub Actions) – Linting, testing, building, and uploading artifacts to S3
- 🚀 CD Pipeline (GitHub Actions) – Deployment to EC2 staging & production with smoke tests
- 🔁 Rollback Mechanism – Safe fallback using versioning (previous.txt and latest.txt)
- 📈 Monitoring & Alerts – CloudWatch dashboards and SNS email notifications
- 🔐 Secrets & Security Scanning – GitHub Secrets setup and SonarCloud integration for code quality

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
- **Responsive Design**: Modern UI with Tailwind CSS and dark mode support
- **Real-time Search**: Client-side search functionality
- **Serverless Architecture**: AWS Lambda functions for scalable backend
- **Infrastructure as Code**: AWS infrastructure managed with Terraform
- **CI/CD Pipeline**: Automated testing, building, and deployment
- **Local Development**: Docker-based local DynamoDB for development

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

## ☁️ AWS Services Used

This project uses various AWS services to create a scalable and reliable cloud architecture:

### Core Services

- **🗄️ DynamoDB** - NoSQL database for storing book data with auto-scaling
- **⚡ Lambda** - Serverless compute for API backend (Node.js 18.x)
- **🌐 API Gateway** - HTTP API for routing requests to Lambda functions
- **🪣 S3** - Object storage for artifacts, deployment packages, and static files
- **🖥️ EC2** - Virtual machines for staging and production environments

### Monitoring & Alerting

- **📊 CloudWatch Logs** - Centralized logging for Lambda and API Gateway
- **⚠️ CloudWatch Alarms** - Monitoring for Lambda errors and EC2 health checks
- **📧 SNS** - Email notifications for alerts and system events
- **📈 CloudWatch Metrics** - Performance monitoring and custom metrics

### Security & Access

- **🔑 IAM Roles** - Fine-grained permissions for services
- **🔐 IAM Users** - Dedicated users for CI/CD pipelines
- **🛡️ Security Groups** - Network security for EC2 instances
- **🗝️ EC2 Key Pairs** - SSH access for server management

### Infrastructure Management

- **📋 Terraform State** - Remote state storage in S3 with encryption
- **🏗️ Infrastructure as Code** - All resources managed via Terraform
- **🔄 Versioning** - S3 bucket versioning for artifact management

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
