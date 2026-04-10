resource "aws_s3_bucket" "user_data" {
  bucket = "my-company-user-data"
  acl    = "public-read"
}

resource "aws_s3_bucket_policy" "user_data_policy" {
  bucket = aws_s3_bucket.user_data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject", "s3:ListBucket"]
        Resource  = [
          "${aws_s3_bucket.user_data.arn}",
          "${aws_s3_bucket.user_data.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_db_instance" "app_db" {
  identifier        = "app-database"
  engine            = "mysql"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  username          = "admin"
  password          = "SuperSecret123!"
  publicly_accessible = true
  skip_final_snapshot = true
}
