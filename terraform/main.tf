provider "aws" {
  region = var.aws_region
}

# Generate S3 Bucket to Store CI Artifact
resource "aws_s3_bucket" "ci_artifact" {
  bucket = var.artifact_bucket_name
  versioning {
    enabled = true
  }
}

# IAM User for Github Actions CLI CI
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

# IAM User for Github Actions CLI CD
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

# Generate Access Key and Secret Access Key for each IAM User
resource "aws_iam_access_key" "ci_key" {
  user = aws_iam_user.ci_user.name
}

resource "aws_iam_access_key" "cd_key" {
  user = aws_iam_user.cd_user.name
}

# Shared Security Group
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

# EC2 for Staging
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

# EC2 for Production
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