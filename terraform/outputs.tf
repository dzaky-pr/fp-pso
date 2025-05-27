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
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table created"
  value       = aws_dynamodb_table.books_table.name
}

output "lambda_function_name_output" {
  description = "Name of the Lambda function created"
  value       = aws_lambda_function.book_library_lambda.function_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.lambda_errors.arn
}

output "ec2_public_ip" {
  value = aws_instance.app_server.public_ip
}
