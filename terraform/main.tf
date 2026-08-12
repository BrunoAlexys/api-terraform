terraform {
  backend "s3" {
    bucket                      = "tf-state-bucket"
    key                         = "api-filmes/terraform.tfstate"
    region                      = "us-east-1"
    
    # Aponta o S3 para o LocalStack
    endpoint                    = "http://localhost:4566"
    
    # Necessário para rodar no LocalStack sem credenciais AWS reais
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    force_path_style            = true
  }
}

provider "aws" {
  # O Terraform buscará automaticamente AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e AWS_REGION
  # do ambiente (ex: arquivo .env injetado na pipeline ou no console)

  # Important settings to make the provider work with LocalStack
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    dynamodb = "http://localhost:4566"
  }
}

resource "aws_dynamodb_table" "movies" {
  name           = "Movies"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Environment = "local"
    Project     = "api-terraform"
  }
}
