#!/bin/bash
set -e

echo "🚀 Setting up Book Library Infrastructure..."

# Check prerequisites
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed. Please install AWS CLI first."
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform not installed. Please install Terraform first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

# Create S3 bucket for Terraform state
BUCKET_NAME="tf-state-bucket-booklibrary-$(date +%s)"
echo "📦 Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region ap-southeast-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Create terraform.tfvars if not exists
if [ ! -f "terraform/terraform.tfvars" ]; then
    echo "📝 Creating terraform.tfvars from example..."
    cp terraform/terraform.tfvars.example terraform/terraform.tfvars
    echo "⚠️  Please update terraform/terraform.tfvars with your values"
fi

echo "✅ Setup complete! Update terraform.tfvars and run:"
echo "   cd terraform"
echo "   terraform init"
echo "   terraform plan"
echo "   terraform apply"