variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default = "ap-southeast-1"
}

variable "aws_access_key" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key ID"
  type        = string
  sensitive   = true
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
}

variable "instance_type" {
  default = "t3.micro"
}

variable "key_pair_name" {
  description = "SSH key pair name for EC2 instances"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the EC2 instance will run"
  type        = string
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
  default     = "BookLibraryLambdaErrors"
}

variable "lambda_code_path" {
  description = "Path to the lambda.js file"
  type        = string
  default     = "./lambda.js" # Assumes lambda.js is in the same directory
}
