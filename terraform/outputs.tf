# --- VPC Outputs ---
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.book_library_vpc.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.book_library_vpc.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public_subnets[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private_subnets[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.book_library_igw.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = var.enable_nat_gateway ? aws_nat_gateway.nat_gateway[*].id : []
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.app_sg.id
}

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

# --- EIP Outputs ---
output "staging_ip" {
  description = "Elastic IP (static) for the staging environment"
  value       = aws_eip.staging_eip.public_ip
}

output "production_ip" {
  description = "Elastic IP (static) for the production environment"
  value       = aws_eip.production_eip.public_ip
}

output "staging_public_dns" {
  description = "Public DNS for the staging environment"
  value       = aws_instance.staging.public_dns
}

output "production_public_dns" {
  description = "Public DNS for the production environment"  
  value       = aws_instance.production.public_dns
}

# (Opsional: jika ingin tahu allocation_id / association_id)
# output "staging_eip_id"    { value = aws_eip.staging_eip.id }
# output "production_eip_id" { value = aws_eip.production_eip.id }


output "ci_trigger_status" {
  value = "CI/CD Pipeline trigger added after infra provisioning 🚀"
}

# --- CloudWatch Dashboard Outputs ---
output "cloudwatch_dashboard_infrastructure_url" {
  description = "URL to the CloudWatch Dashboard for Infrastructure monitoring"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.book_library_dashboard.dashboard_name}"
}

output "cloudwatch_dashboard_application_url" {
  description = "URL to the CloudWatch Dashboard for Application performance monitoring"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.book_library_app_dashboard.dashboard_name}"
}

output "monitoring_summary" {
  description = "Summary of monitoring resources"
  value = {
    infrastructure_dashboard = aws_cloudwatch_dashboard.book_library_dashboard.dashboard_name
    application_dashboard    = aws_cloudwatch_dashboard.book_library_app_dashboard.dashboard_name
    lambda_log_group        = aws_cloudwatch_log_group.lambda_log_group.name
    api_gateway_log_group   = aws_cloudwatch_log_group.api_gw_logs.name
    sns_alerts_topic        = aws_sns_topic.lambda_errors.arn
  }
}