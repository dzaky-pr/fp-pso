ami_id = "ami-0c1907b6d738188e5" # Example AMI ID for Ubuntu 22.04 in ap-southeast-1 Already Set as Default in variables.tf
jwt_secret = "your-super-secret-jwt-key-change-this-in-production"
key_pair_name = "your-key-pair-name"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
availability_zones = ["ap-southeast-1a", "ap-southeast-1b"]
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
enable_nat_gateway = false
environment = "development"
project_name = "book-library"

# Alert emails
alert_emails = [
  "your-email@example.com"
]

# AWS Region
aws_region = "ap-southeast-1"