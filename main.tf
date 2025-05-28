# --- Provider Configuration ---
provider "aws" {
  region = "us-east-1" # Specify your desired AWS region
}

# --- Variables ---
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

# --- Data: Package Lambda Code ---
# Note: Ensure your lambda.js is saved locally and uses .mjs extension or package.json type=module
#       if using ES modules with older Node.js runtimes. For Node.js 18+, .js is often fine.
#       This example packages the single lambda.js file.
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = var.lambda_code_path
  output_path = "${path.module}/lambda_package.zip"
}

# --- S3 Bucket for Lambda Code ---
resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "book-library-lambda-code-bucket-${random_id.bucket_suffix.hex}"
}


resource "random_id" "bucket_suffix" {
  byte_length = 8
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

# --- IAM Role and Policy for Lambda ---
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

# --- Outputs ---
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