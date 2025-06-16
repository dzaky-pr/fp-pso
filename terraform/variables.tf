variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "artifact_bucket_name" {
  description = "Name of the S3 bucket for storing App artifacts"
  type        = string
  default     = "book-library-artifact"
}

variable "api_bucket_name" {
  description = "Name of the S3 bucket for storing Lambda code"
  type        = string
  default     = "book-library-api-code"
}

variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string
  default     = "ami-0c1907b6d738188e5" # AMI ID for Ubuntu 20.04 in ap-southeast-1
}

variable "instance_type" {
  default = "t3.micro"
}

variable "key_pair_name" {
  description = "SSH key pair name for EC2 instances"
  type        = string
}

# --- VPC Variables ---
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = false  # Set to true for production
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "book-library"
}

variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "books" # Default table name from lambda.js [cite: 31]
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "BookLibraryFunction"
}

variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "BookLibraryAPI"
}

variable "sns_topic_name" {
  description = "Name for the SNS Topic for alerts"
  type        = string
  default     = "BookLibraryErrors"
}

variable "alert_emails" {
  description = "List of emails to alert to"
  type        = list(string)
  default     = ["fransnicklaus101004@gmail.com", "darrell.valentino14@gmail.com", "titovirgiawan21@gmail.com", "dzakyfordev@gmail.con"]
}

variable "lambda_code_path" {
  description = "Path to the lambda.js file"
  type        = string
  default     = "./lambda.js" # Assumes lambda.js is in the same directory
}

variable "jwt_secret" {
  description = "The secret key for signing JWTs"
  type        = string
  sensitive   = true
}