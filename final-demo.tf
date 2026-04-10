resource "aws_instance" "bad" {
  ami = "ami-123456"
  instance_type = "t2.micro"
}

resource "aws_security_group" "open_all" {
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}