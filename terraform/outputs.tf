# Output Access Key and Secret Access Key for GitHub Actions
output "ci_access_key_id" {
  description = "Access Key ID for the CI IAM user"
  value       = aws_iam_access_key.ci_key.id
  sensitive   = true
}

output "ci_secret_access_key" {
  description = "Secret Access Key for the CI IAM user"
  value       = aws_iam_access_key.ci_key.secret
  sensitive   = true
}

output "cd_access_key_id" {
  description = "Access Key ID for the CD IAM user"
  value       = aws_iam_access_key.cd_key.id
  sensitive   = true
}

output "cd_secret_access_key" {
  description = "Secret Access Key for the CD IAM user"
  value       = aws_iam_access_key.cd_key.secret
  sensitive   = true
}

# Output Lambda API Setup
output "api_gateway_url" {
  description = "The invoke URL for the API Gateway"
  value       = aws_apigatewayv2_api.api_books.api_endpoint
}

output "artifact_bucket_name" {
  description = "Name of the S3 bucket for Lambda artifacts"
  value       = aws_s3_bucket_versioning.artifact.bucket
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table created"
  value       = aws_dynamodb_table.books_table.name
}

output "users_table_name" {
  description = "The name of the DynamoDB users table"
  value = aws_dynamodb_table.users_table.name
}

output "lambda_function_name_output" {
  description = "Name of the Lambda function created"
  value       = aws_lambda_function.book_library_lambda.function_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.lambda_errors.arn
}

output "staging_public_ip" {
  description = "Public IP address of the staging EC2 instance"
  value = aws_instance.staging.public_ip
}

output "staging_public_dns" {
  description = "Public DNS address of the staging EC2 instance"
  value = aws_instance.staging.public_dns
}

output "production_public_ip" {
  description = "Public IP address of the production EC2 instance"
  value = aws_instance.production.public_ip
}

output "production_public_dns" {
  description = "Public DNS address of the production EC2 instance"
  value = aws_instance.production.public_dns
}

output "ci_trigger_status" {
  value = "CI/CD Pipeline trigger added after infra provisioning 🚀"
}