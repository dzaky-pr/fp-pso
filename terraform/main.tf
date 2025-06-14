provider "aws" {
  region = var.aws_region
}

terraform {
  backend "s3" {
    bucket         = "tf-state-bucket-booklibrary"
    key            = "terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
  }
}

resource "random_id" "suffix" {
  # Random ID for unique resource names
  byte_length = 4
}

# --- S3 Bucket ---
resource "aws_s3_bucket" "artifact" {
  bucket = "${var.artifact_bucket_name}-${random_id.suffix.hex}"
  force_destroy = true # Allows deletion of non-empty bucket

  tags = {
    Name        = "${var.artifact_bucket_name}-${random_id.suffix.hex}"
    Environment = "Dev"
    Project     = "BookLibrary"
  }
}

resource "aws_s3_bucket_versioning" "artifact" {
  bucket = aws_s3_bucket.artifact.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "${var.api_bucket_name}-${random_id.suffix.hex}"

  tags = {
    Name        = "${var.api_bucket_name}-${random_id.suffix.hex}"
    Environment = "Dev"
    Project     = "BookLibrary"
  }
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file  = var.lambda_code_path
  output_path = "build/lambda_package.zip"
}

resource "aws_s3_object" "lambda_code_upload" {
  bucket = aws_s3_bucket.lambda_bucket.id
  key    = "lambda_package.zip"
  source = data.archive_file.lambda_zip.output_path
  etag   = filemd5(data.archive_file.lambda_zip.output_path)
}
# ----------------

# --- DynamoDB Table ---
resource "aws_dynamodb_table" "books_table" {
  name         = "${var.table_name}-${random_id.suffix.hex}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "N" # N for Number, based on lambda.js [cite: 32, 34]
  }
  
  tags = {
    Name        = "${var.table_name}-${random_id.suffix.hex}"
    Environment = "Dev"
    Project     = "BookLibrary"
  }
}

# --- DynamoDB Table for Users ---
resource "aws_dynamodb_table" "users_table" {
  name             = "users"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "userId" 

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S" # Tipe data string untuk email
  }

  global_secondary_index {
    name               = "EmailIndex" 
    hash_key           = "email"   
    projection_type    = "ALL"

    read_capacity      = 1
    write_capacity     = 1
  }

  tags = {
    Name        = "users-table-book-library"
    Environment = "Dev" # Sesuaikan dengan tag lingkungan Anda
    Project     = "BookLibrary"
  }
}
# ----------------

# --- IAM User ---
resource "aws_iam_user" "ci_user" {
  name = "github-actions-cli-ci-${random_id.suffix.hex}"
}

resource "aws_iam_user_policy" "ci_policy" {
  name   = "ci-access-policy-${random_id.suffix.hex}"
  user   = aws_iam_user.ci_user.name
  policy = data.aws_iam_policy_document.ci_doc.json
}

data "aws_iam_policy_document" "ci_doc" {
  statement {
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:PutObjectAcl",
      "s3:ListBucket",
      "s3:DeleteObject"
    ]
    resources = [
      aws_s3_bucket.artifact.arn,
      "${aws_s3_bucket.artifact.arn}/*"
    ]
  }
}

resource "aws_iam_user" "cd_user" {
  name = "github-actions-cli-cd-${random_id.suffix.hex}"
}

resource "aws_iam_user_policy" "cd_policy" {
  name   = "cd-access-policy-${random_id.suffix.hex}"
  user   = aws_iam_user.cd_user.name
  policy = data.aws_iam_policy_document.cd_doc.json
}

data "aws_iam_policy_document" "cd_doc" {
  statement {
    sid     = "ReadOnlyS3ArtifactBucket"
    effect  = "Allow"

    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:PutObjectAcl",
      "s3:ListBucket"
    ]

    resources = [
      aws_s3_bucket.artifact.arn,
      "${aws_s3_bucket.artifact.arn}/*"
    ]
  }

  statement {
    sid     = "OptionalEC2AndELBAccess"
    effect  = "Allow"

    actions = [
      "ec2:DescribeInstances",
      "ec2:DescribeTags",
      "elasticloadbalancing:Describe*",
      "elasticloadbalancing:ModifyListener",
      "elasticloadbalancing:ModifyRule"
    ]

    resources = ["*"]
  }
}

resource "aws_iam_role" "lambda_exec_role" {
  name = "${var.lambda_function_name}-role-${random_id.suffix.hex}"

  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.lambda_function_name}-policy-${random_id.suffix.hex}"
  description = "Policy for Book Library Lambda function"

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",    # [cite: 32]
          "dynamodb:PutItem",    # [cite: 34]
          "dynamodb:DeleteItem", # [cite: 35]
          "dynamodb:Scan"        # [cite: 33]
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.books_table.arn
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*" # Allow logging to CloudWatch
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}
# ----------------

# --- Access Key & Secret Key ---
resource "aws_iam_access_key" "ci_key" {
  user = aws_iam_user.ci_user.name
}

resource "aws_iam_access_key" "cd_key" {
  user = aws_iam_user.cd_user.name
}

# --- CloudWatch Log Group for Lambda ---
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = 14 # Set your desired log retention period
}
# ----------------

# --- AWS Lambda Function ---
resource "aws_lambda_function" "book_library_lambda" {
  function_name = "${var.lambda_function_name}-${random_id.suffix.hex}"
  handler       = "lambda.handler" # Assumes lambda.js exports 'handler' [cite: 35]
  runtime       = "nodejs18.x"     # Choose a suitable Node.js runtime
  role          = aws_iam_role.lambda_exec_role.arn

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_code_upload.key
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.books_table.name # Pass table name as env var (optional, as it's hardcoded in lambda.js) [cite: 31]
    }
  }

 depends_on = [
  aws_iam_role_policy_attachment.lambda_policy_attach,
  aws_cloudwatch_log_group.lambda_log_group,
  aws_s3_object.lambda_code_upload
  ]

  tags = {
    Name = "BookLibraryFunction"
  }
}

# --- API Gateway (HTTP API) ---
resource "aws_apigatewayv2_api" "api_books" {
  name          = "BooksAPI-${random_id.suffix.hex}"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "api_books_stage" {
  api_id      = aws_apigatewayv2_api.api_books.id
  name        = "$default"
  auto_deploy = true
}

# Single Lambda proxy integration for all /books routes
resource "aws_apigatewayv2_integration" "books_integration" {
  api_id                 = aws_apigatewayv2_api.api_books.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.book_library_lambda.invoke_arn
  payload_format_version = "2.0"
}


# Define routes based on lambda.js
resource "aws_apigatewayv2_route" "get_books" {
  api_id    = aws_apigatewayv2_api.api_books.id
  route_key = "GET /books"
  target    = "integrations/${aws_apigatewayv2_integration.books_integration.id}"
}

resource "aws_apigatewayv2_route" "get_book_by_id" {
  api_id    = aws_apigatewayv2_api.api_books.id
  route_key = "GET /books/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.books_integration.id}"
}

resource "aws_apigatewayv2_route" "put_book" {
  api_id    = aws_apigatewayv2_api.api_books.id
  route_key = "PUT /books"
  target    = "integrations/${aws_apigatewayv2_integration.books_integration.id}"
}

resource "aws_apigatewayv2_route" "delete_book" {
  api_id    = aws_apigatewayv2_api.api_books.id
  route_key = "DELETE /books/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.books_integration.id}"
}

resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.api_books.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.books_integration.id}"
}

resource "aws_cloudwatch_log_group" "api_gw_logs" {
  name              = "/aws/api-gw/${var.api_name}"
  retention_in_days = 14
}

# --- Lambda Permission for API Gateway ---
resource "aws_lambda_permission" "allow_api_books" {
  statement_id  = "AllowBooksAPIInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.book_library_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_books.execution_arn}/*/*/books"
}

resource "aws_lambda_permission" "allow_api_books_detail" {
  statement_id  = "AllowBooksDetailAPIInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.book_library_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_books.execution_arn}/*/*/books/{id}"
}

resource "aws_lambda_permission" "allow_api_health" {
  statement_id  = "AllowHealthAPIInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.book_library_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_books.execution_arn}/*/*/health"
}

# --- SNS Topic for Alerts ---

resource "aws_sns_topic_subscription" "email_alerts" {
  for_each  = toset(var.alert_emails)
  topic_arn = aws_sns_topic.lambda_errors.arn
  protocol  = "email"
  endpoint  = each.value

  # lifecycle {
  #   prevent_destroy = true
  # }
}

resource "aws_sns_topic" "lambda_errors" {
  name = var.sns_topic_name
}

# --- CloudWatch Alarm for Lambda Errors ---
resource "aws_cloudwatch_metric_alarm" "lambda_error_alarm" {
  alarm_name          = "${var.lambda_function_name}-errors-${random_id.suffix.hex}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60" # Check every 60 seconds
  statistic           = "Sum"
  threshold           = "1"  # Trigger if 1 or more errors occur
  alarm_description   = "Alarm when the Book Library Lambda function has errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.book_library_lambda.function_name
  }

  alarm_actions = [aws_sns_topic.lambda_errors.arn]
  ok_actions    = [aws_sns_topic.lambda_errors.arn] # Optional: Notify when OK too
}

resource "aws_cloudwatch_metric_alarm" "ec2_status_check_failed" {
  alarm_name          = "ec2-status-check-failed-${random_id.suffix.hex}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    InstanceId = aws_instance.production.id
  }

  alarm_actions = [
    aws_sns_topic.lambda_errors.arn, # reuse same SNS topic
  ]
  ok_actions = [
    aws_sns_topic.lambda_errors.arn,
  ]
}


# --- Shared Security Group ---
resource "aws_security_group" "app_sg" {
  name        = "book-library-sg-${random_id.suffix.hex}"
  description = "Allow HTTP and SSH"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Replace with a safe IP range
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "App (Port 3000)"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"] # Allow IPv6 traffic
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- AWS AMI ---
# data "aws_ami" "ubuntu_jammy" {
#   most_recent = true
#   owners      = ["099720109477"] # Canonical's official Ubuntu AMI owner ID

#   filter {
#     name   = "name"
#     values = ["ubuntu/images/hvm-ssd/ubuntu-focal-22.04-amd64-server-*"]
#   }
#   filter {
#     name   = "virtualization-type"
#     values = ["hvm"]
#   }
# }

resource "aws_iam_role" "ec2_role" {
  name = "book-library-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "s3_access" {
  name = "book-library-s3-access"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      Resource = [
        "arn:aws:s3:::${aws_s3_bucket.artifact.bucket}",
        "arn:aws:s3:::${aws_s3_bucket.artifact.bucket}/*"
      ]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "attach_s3_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "book-library-instance-profile"
  role = aws_iam_role.ec2_role.name
}

# --- EC2 ---
resource "aws_instance" "staging" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_pair_name
  security_groups = [aws_security_group.app_sg.name]

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  tags = {
    Name = "book-library-staging-${random_id.suffix.hex}"
  }

  user_data = <<-EOF
              #!/bin/bash -xe
              exec > /var/log/user-data.log 2>&1

              apt update && apt install -y curl unzip

              curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
              sudo apt install -y nodejs

              curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
              unzip awscliv2.zip
              sudo ./aws/install

              # Install PM2 globally
              npm install -g pm2

              mkdir -p deploy
              EOF
}

resource "aws_instance" "production" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_pair_name
  security_groups = [aws_security_group.app_sg.name]

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  tags = {
    Name = "book-library-production-${random_id.suffix.hex}"
  }

  user_data = <<-EOF
              #!/bin/bash -xe
              exec > /var/log/user-data.log 2>&1

              apt update && apt install -y curl unzip

              curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
              sudo apt install -y nodejs

              curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
              unzip awscliv2.zip
              sudo ./aws/install

              # Install PM2 globally
              npm install -g pm2
              EOF

  depends_on = [
    aws_iam_role_policy_attachment.attach_s3_policy
    # null_resource.trigger_ci_pipeline
  ]
}


# resource "null_resource" "trigger_ci_pipeline" {
#   provisioner "local-exec" {
#     command = <<EOT
#       curl -X POST \
#         -H "Authorization: token ${var.github_token}" \
#         -H "Accept: application/vnd.github+json" \
#         https://api.github.com/repos/${var.github_repo}/actions/workflows/ci-pipeline.yml/dispatches \
#         -d '{"ref": "${var.github_branch}"}'
#     EOT
#   }

#   depends_on = [
#     aws_s3_bucket.artifact
#   ]
# }