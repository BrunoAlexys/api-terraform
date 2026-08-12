# Empacotamento do Código fonte (Gera o arquivo ZIP)
data "archive_file" "api_zip" {
  type        = "zip"
  source_dir  = "${path.module}/.."
  output_path = "${path.module}/api-lambda.zip"
  excludes = [
    "terraform",
    ".git",
    ".github",
    "tests",
    "coverage",
    ".dockerignore",
    "Dockerfile",
    "docker-compose.yml",
    "README.md"
  ]
}

# Criação da Role do IAM para a Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "serverless_lambda_exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Função AWS Lambda
resource "aws_lambda_function" "api_lambda" {
  function_name    = "FilmesApi"
  filename         = data.archive_file.api_zip.output_path
  source_code_hash = data.archive_file.api_zip.output_base64sha256
  handler          = "src/lambda.handler" # Aponta para o arquivo src/lambda.js e método handler
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      NODE_ENV          = "production"
      DYNAMODB_ENDPOINT = "http://localhost:4566" # A Lambda rodando dentro do LocalStack acessa os serviços na mesma rede interna
    }
  }
}

# API Gateway (HTTP API - v2)
resource "aws_apigatewayv2_api" "http_api" {
  name          = "FilmesHttpApi"
  protocol_type = "HTTP"
}

# Estágio padrão (Deploy automático)
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# Integração da API Gateway com a Lambda
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  
  integration_uri    = aws_lambda_function.api_lambda.invoke_arn
  integration_method = "POST"
}

# Rota curinga que encaminha todas as requisições para a Lambda
resource "aws_apigatewayv2_route" "any_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# Permissão para o API Gateway chamar a função Lambda
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# URL Pública gerada para acessar a API
output "api_endpoint" {
  description = "A URL base (endpoint) do API Gateway simulada pelo LocalStack"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}
