variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default = "ap-southeast-1"
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
  default     = "ami-0c1907b6d738188e5" # AMI ID for Ubuntu 20.04 in ap-southeast-1 [cite: 30]
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