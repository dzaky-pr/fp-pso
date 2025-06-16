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

# --- Data Sources ---
data "aws_availability_zones" "available" {
  state = "available"
}

# --- VPC Infrastructure ---
resource "aws_vpc" "book_library_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc-${random_id.suffix.hex}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Internet Gateway
resource "aws_internet_gateway" "book_library_igw" {
  vpc_id = aws_vpc.book_library_vpc.id

  tags = {
    Name        = "${var.project_name}-igw-${random_id.suffix.hex}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Public Subnets
resource "aws_subnet" "public_subnets" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.book_library_vpc.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-${count.index + 1}-${random_id.suffix.hex}"
    Type        = "Public"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Private Subnets
resource "aws_subnet" "private_subnets" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.book_library_vpc.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-private-subnet-${count.index + 1}-${random_id.suffix.hex}"
    Type        = "Private"
    Environment = var.environment
    Project     = var.project_name
  }
}

# NAT Gateway (untuk private subnets) - Optional untuk cost optimization
resource "aws_eip" "nat_gateway_eip" {
  count  = var.enable_nat_gateway ? length(var.availability_zones) : 0
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-nat-eip-${count.index + 1}-${random_id.suffix.hex}"
    Environment = var.environment
    Project     = var.project_name
  }

  depends_on = [aws_internet_gateway.book_library_igw]
}

resource "aws_nat_gateway" "nat_gateway" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0

  allocation_id = aws_eip.nat_gateway_eip[count.index].id
  subnet_id     = aws_subnet.public_subnets[count.index].id

  tags = {
    Name        = "${var.project_name}-nat-gateway-${count.index + 1}-${random_id.suffix.hex}"
    Environment = var.environment
    Project     = var.project_name
  }

  depends_on = [aws_internet_gateway.book_library_igw]
}

# Route Table - Public
resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.book_library_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.book_library_igw.id
  }

  tags = {
    Name        = "${var.project_name}-public-rt-${random_id.suffix.hex}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Route Table - Private
resource "aws_route_table" "private_route_table" {
  count  = var.enable_nat_gateway ? length(var.availability_zones) : 0
  vpc_id = aws_vpc.book_library_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateway[count.index].id
  }

  tags = {
    Name        = "${var.project_name}-private-rt-${count.index + 1}-${random_id.suffix.hex}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Route Table Associations - Public
resource "aws_route_table_association" "public_subnet_associations" {
  count = length(aws_subnet.public_subnets)

  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_route_table.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private_subnet_associations" {
  count = var.enable_nat_gateway ? length(aws_subnet.private_subnets) : 0

  subnet_id      = aws_subnet.private_subnets[count.index].id
  route_table_id = aws_route_table.private_route_table[count.index].id
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

# Build Lambda function
resource "null_resource" "build_lambda" {
  triggers = {
    lambda_source = filemd5("${path.module}/lambda.js")
    package_json = filemd5("${path.module}/../package.json")
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/.. && npm run build:lambda"
  }
}

data "archive_file" "lambda_zip" {
  depends_on = [null_resource.build_lambda]
  
  type        = "zip"
  source_file = "${path.module}/dist/lambda.js"
  output_path = "${path.module}/build/lambda_package.zip"
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
  name         = "users-${random_id.suffix.hex}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId" 

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
    Name        = "users-table-book-library-${random_id.suffix.hex}"
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
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Scan",
          "dynamodb:Query" # Diperlukan untuk login via EmailIndex
        ]
        Effect   = "Allow"
        Resource = [
            aws_dynamodb_table.users_table.arn,
            "${aws_dynamodb_table.users_table.arn}/index/EmailIndex" 
        ]
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
  source_code_hash = filebase64sha256("${path.module}/build/lambda_package.zip")

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.books_table.name # Pass table name as env var (optional, as it's hardcoded in lambda.js) [cite: 31]
      USERS_TABLE_NAME = aws_dynamodb_table.users_table.name
      JWT_SECRET       = var.jwt_secret  
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

resource "aws_apigatewayv2_route" "get_my_books" {
  api_id    = aws_apigatewayv2_api.api_books.id
  route_key = "GET /my-books"
  target    = "integrations/${aws_apigatewayv2_integration.books_integration.id}"
}

resource "aws_apigatewayv2_route" "post_register" {
  api_id    = aws_apigatewayv2_api.api_books.id
  route_key = "POST /register"
  target    = "integrations/${aws_apigatewayv2_integration.books_integration.id}"
}

resource "aws_apigatewayv2_route" "post_login" {
  api_id    = aws_apigatewayv2_api.api_books.id
  route_key = "POST /login"
  target    = "integrations/${aws_apigatewayv2_integration.books_integration.id}"
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

resource "aws_apigatewayv2_route" "delete_account" {
  api_id    = aws_apigatewayv2_api.api_books.id
  route_key = "DELETE /account"
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

resource "aws_lambda_permission" "allow_api_login" {
  statement_id  = "AllowLoginAPIInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.book_library_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_books.execution_arn}/*/*/login"
}

resource "aws_lambda_permission" "allow_api_register" {
  statement_id  = "AllowRegisterAPIInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.book_library_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_books.execution_arn}/*/*/register"
}

resource "aws_lambda_permission" "allow_api_delete_account" {
  statement_id  = "AllowDeleteAccountAPIInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.book_library_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_books.execution_arn}/*/*/account"
}

# --- SNS Topic for Alerts ---

resource "aws_sns_topic_subscription" "email_alerts" {
  for_each  = toset(var.alert_emails)
  topic_arn = aws_sns_topic.lambda_errors.arn
  protocol  = "email"
  endpoint  = each.value

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
  vpc_id      = aws_vpc.book_library_vpc.id

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
  ami                         = var.ami_id
  instance_type               = var.instance_type
  key_name                    = var.key_pair_name
  subnet_id                   = aws_subnet.public_subnets[0].id
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  tags = {
    Name        = "book-library-staging-${random_id.suffix.hex}"
    Environment = "staging"
    Project     = var.project_name
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
  ami                         = var.ami_id
  instance_type               = var.instance_type
  key_name                    = var.key_pair_name
  subnet_id                   = aws_subnet.public_subnets[1].id
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  tags = {
    Name        = "book-library-production-${random_id.suffix.hex}"
    Environment = "production"
    Project     = var.project_name
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

# Alternative: Multi-AZ deployment
# data "aws_availability_zones" "available" {
#   state = "available"
# }

# data "aws_subnets" "multi_az" {
#   filter {
#     name   = "vpc-id"
#     values = [var.vpc_id]
#   }
#   
#   filter {
#     name   = "availability-zone"
#     values = data.aws_availability_zones.available.names
#   }
# }

# For production: spread across multiple AZs
# subnet_id = data.aws_subnets.multi_az.ids[count.index % length(data.aws_subnets.multi_az.ids)]
