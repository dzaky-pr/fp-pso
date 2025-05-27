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

output "ec2_public_ip" {
  value = aws_instance.app_server.public_ip
}
