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
