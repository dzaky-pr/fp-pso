variable "aws_region" {
  default = "ap-southeast-1"
}

variable "artifact_bucket_name" {
  default = "book-library-ci-artifact"
}

variable "ami_id" {
  description = "Ubuntu AMI ID for EC2"
}

variable "instance_type" {
  default = "t3.micro"
}

variable "key_pair_name" {
  description = "SSH key pair name"
}

variable "vpc_id" {
  description = "VPC ID for the EC2 instance"
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
