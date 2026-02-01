#!/bin/sh
# Generate self-signed SSL certificate for local development
# Usage: ./generate-ssl.sh

set -e

SSL_DIR="$(dirname "$0")/ssl"
mkdir -p "$SSL_DIR"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_DIR/server.key" \
  -out "$SSL_DIR/server.crt" \
  -subj "/C=DE/ST=Local/L=Dev/O=ProductPlatform/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "SSL certificate generated in $SSL_DIR/"
echo "To enable HTTPS:"
echo "  1. Uncomment the HTTPS server block in nginx.conf"
echo "  2. Mount the ssl directory in docker-compose.yml:"
echo "     volumes:"
echo "       - ./docker/nginx/ssl:/etc/nginx/ssl:ro"
echo "  3. Expose port 443 in docker-compose.yml:"
echo "     ports:"
echo "       - \"443:443\""
