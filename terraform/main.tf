provider "aws" {
  region = var.aws_region
}

# --- S3 Bucket ---
resource "aws_s3_bucket" "ci_artifact" {
  bucket = var.artifact_bucket_name
  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "book-library-lambda-code-bucket-${random_id.bucket_suffix.hex}"
}

resource "random_id" "bucket_suffix" {
  byte_length = 8
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = var.lambda_code_path
  output_path = "build/lambda_package.zip"
}

resource "aws_s3_object" "lambda_code_upload" {
  bucket = aws_s3_bucket.lambda_bucket.id
  key    = "lambda_package.zip"
  source = data.archive_file.lambda_zip.output_path
  etag   = filemd5(data.archive_file.lambda_zip.output_path)
}

# --- DynamoDB Table ---
resource "aws_dynamodb_table" "books_table" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "N" # N for Number, based on lambda.js [cite: 32, 34]
  }

  tags = {
    Name        = "BookLibraryTable"
    Environment = "Dev"
  }
}

# --- IAM User ---
resource "aws_iam_user" "ci_user" {
  name = "github-actions-cli-ci"
}

resource "aws_iam_user_policy" "ci_policy" {
  name   = "ci-access-policy"
  user   = aws_iam_user.ci_user.name
  policy = data.aws_iam_policy_document.ci_doc.json
}

data "aws_iam_policy_document" "ci_doc" {
  statement {
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:PutObjectAcl",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.ci_artifact.arn,
      "${aws_s3_bucket.ci_artifact.arn}/*"
    ]
  }
}

resource "aws_iam_user" "cd_user" {
  name = "github-actions-cli-cd"
}

resource "aws_iam_user_policy" "cd_policy" {
  name   = "cd-access-policy"
  user   = aws_iam_user.cd_user.name
  policy = data.aws_iam_policy_document.cd_doc.json
}

data "aws_iam_policy_document" "cd_doc" {
  statement {
    sid     = "ReadOnlyS3ArtifactBucket"
    effect  = "Allow"

    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]

    resources = [
      aws_s3_bucket.ci_artifact.arn,
      "${aws_s3_bucket.ci_artifact.arn}/*"
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
  name = "${var.lambda_function_name}-role"

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
  name        = "${var.lambda_function_name}-policy"
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

# --- AWS Lambda Function ---
resource "aws_lambda_function" "book_library_lambda" {
  function_name = var.lambda_function_name
  handler       = "lambda.handler" # Assumes lambda.js exports 'handler' [cite: 35]
  runtime       = "nodejs18.x"     # Choose a suitable Node.js runtime
  role          = aws_iam_role.lambda_exec_role.arn

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_code_upload.key
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = var.table_name # Pass table name as env var (optional, as it's hardcoded in lambda.js) [cite: 31]
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
resource "aws_apigatewayv2_api" "http_api" {
  name          = var.api_name
  protocol_type = "HTTP"
  target        = aws_lambda_function.book_library_lambda.arn
  description   = "API for the Book Library App"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY" # Use Lambda Proxy integration
  integration_uri  = aws_lambda_function.book_library_lambda.invoke_arn
  payload_format_version = "2.0" # Matches HTTP API default
}

# Define routes based on lambda.js
resource "aws_apigatewayv2_route" "get_books" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /books"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "get_book_by_id" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /books/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "put_book" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "PUT /books"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "delete_book" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "DELETE /books/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_cloudwatch_log_group" "api_gw_logs" {
  name              = "/aws/api-gw/${var.api_name}"
  retention_in_days = 14
}

# --- Lambda Permission for API Gateway ---
resource "aws_lambda_permission" "api_gw_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.book_library_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# --- SNS Topic for Alerts ---
resource "aws_sns_topic" "lambda_errors" {
  name = var.sns_topic_name
}

# --- CloudWatch Alarm for Lambda Errors ---
resource "aws_cloudwatch_metric_alarm" "lambda_error_alarm" {
  alarm_name          = "${var.lambda_function_name}-Errors"
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


# --- Shared Security Group ---
resource "aws_security_group" "app_sg" {
  name        = "book-library-sg"
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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- EC2 ---
resource "aws_instance" "staging" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_pair_name
  security_groups = [aws_security_group.app_sg.name]

  tags = {
    Name = "book-library-staging"
  }

  user_data = <<-EOF
              #!/bin/bash
              apt update
              apt install -y awscli nodejs npm
              cd /home/ubuntu
              mkdir app && cd app
              aws s3 cp s3://${var.artifact_bucket_name}/latest.txt .
              VERSION=$(cat latest.txt)
              aws s3 sync s3://${var.artifact_bucket_name}/$VERSION . --exact-timestamps
              npm install --omit=dev
              npm run start
              EOF
}

resource "aws_instance" "production" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_pair_name
  security_groups = [aws_security_group.app_sg.name]

  tags = {
    Name = "book-library-production"
  }

  user_data = <<-EOF
              #!/bin/bash
              apt update
              apt install -y awscli nodejs npm
              cd /home/ubuntu
              mkdir app && cd app
              aws s3 cp s3://${var.artifact_bucket_name}/latest.txt .
              VERSION=$(cat latest.txt)
              aws s3 sync s3://${var.artifact_bucket_name}/$VERSION . --exact-timestamps
              npm install --omit=dev
              npm run start
              EOF
}