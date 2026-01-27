# Produktbewertungs-Plattform - Setup Guide

## Phase 0.5: Infrastructure Setup

This guide will help you set up the local development environment for the Product Review Platform.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (version 24.0 or higher)
- **Docker Compose** (version 2.20 or higher)
- **Git**
- Minimum 4GB RAM available for Docker
- Minimum 10GB free disk space

Verify your installation:

```bash
docker --version
docker-compose --version
```

## Quick Start

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd bp
```

### Step 2: Create Environment File

```bash
cp .env.example .env
```

You can use the default values for local development, or customize them in the `.env` file.

### Step 3: Start All Services

```bash
docker-compose up -d
```

This command will:
- Download all required Docker images
- Create named volumes for data persistence
- Start all services with health checks
- Set up the internal network

### Step 4: Wait for Services to Be Ready

```bash
# Wait approximately 15-30 seconds for all services to become healthy
docker-compose ps
```

All services should show status as "Up" and healthy.

### Step 5: Verify the Setup

Run these commands to verify everything is working:

```bash
# Check all services are running
docker-compose ps

# Test Nginx
curl http://localhost/health

# Test OpenSearch
curl http://localhost:9200

# Test PostgreSQL
docker-compose exec postgres psql -U postgres -d product_platform -c "SELECT 1;"

# Test Redis
docker-compose exec redis redis-cli ping

# Check backend environment variables
docker-compose exec backend env | grep DATABASE_URL
```

## Services Overview

| Service    | Port | URL                      | Purpose                          |
|------------|------|--------------------------|----------------------------------|
| Nginx      | 80   | http://localhost         | Reverse Proxy                    |
| Backend    | 3000 | http://localhost:3000    | NestJS API (Phase 1)             |
| Frontend   | 5173 | http://localhost:5173    | Vue3 App (Phase 1)               |
| PostgreSQL | 5432 | postgres://localhost:5432| Primary Database                 |
| Redis      | 6379 | redis://localhost:6379   | Cache & Session Store            |
| OpenSearch | 9200 | http://localhost:9200    | Search Engine                    |

## Common Commands

### Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# Start with logs visible
docker-compose up
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

### View Logs

```bash
# View all logs
docker-compose logs

# Follow logs (live tail)
docker-compose logs -f

# View logs for specific service
docker-compose logs -f postgres

# View last 100 lines
docker-compose logs --tail=100
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart postgres
```

### Execute Commands in Containers

```bash
# PostgreSQL: Access psql shell
docker-compose exec postgres psql -U postgres -d product_platform

# Redis: Access redis-cli
docker-compose exec redis redis-cli

# Backend: Access shell
docker-compose exec backend sh
```

## Service Connections

Services communicate using Docker DNS names. Use these connection strings in your application:

### From Backend Container:

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/product_platform
REDIS_URL=redis://redis:6379
OPENSEARCH_URL=http://opensearch:9200
```

### From Host Machine:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/product_platform
REDIS_URL=redis://localhost:6379
OPENSEARCH_URL=http://localhost:9200
```

## Troubleshooting

### Services Not Starting

```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs

# Check if ports are already in use
netstat -tulpn | grep -E '80|3000|5173|5432|6379|9200'
```

### OpenSearch Memory Issues

If OpenSearch fails to start with memory errors:

```bash
# Increase Docker memory limit to at least 4GB
# Docker Desktop: Settings > Resources > Memory

# Or reduce OpenSearch memory in docker-compose.yml:
# OPENSEARCH_JAVA_OPTS=-Xms256m -Xmx256m
```

### Port Already in Use

If you get "port already allocated" errors:

```bash
# Find process using the port
lsof -i :80  # or other port number

# Stop the process or change the port in docker-compose.yml
```

### Reset Everything

To completely reset the development environment:

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images (optional)
docker-compose down --rmi all -v

# Start fresh
docker-compose up -d
```

### Database Connection Issues

```bash
# Check if PostgreSQL is healthy
docker-compose exec postgres pg_isready -U postgres

# View PostgreSQL logs
docker-compose logs postgres

# Manually connect to test
docker-compose exec postgres psql -U postgres
```

### OpenSearch Not Responding

```bash
# Check OpenSearch health
curl http://localhost:9200/_cluster/health?pretty

# View OpenSearch logs
docker-compose logs opensearch

# OpenSearch may take 30-60 seconds to start fully
```

## Data Persistence

All data is stored in named Docker volumes:

- `product-platform-postgres-data`: PostgreSQL database files
- `product-platform-redis-data`: Redis persistence files
- `product-platform-opensearch-data`: OpenSearch indices

These volumes persist even when containers are stopped. To delete all data:

```bash
docker-compose down -v
```

## Next Steps

Phase 1 will include:
- NestJS backend implementation
- Vue3 frontend application
- Database schema and migrations
- API endpoints
- Authentication system

## Support

If you encounter issues not covered in this guide:

1. Check the logs: `docker-compose logs -f`
2. Verify Docker resources (CPU, Memory, Disk)
3. Ensure all prerequisites are met
4. Try resetting the environment: `docker-compose down -v && docker-compose up -d`

## Project Structure

```
bp/
├── docker/
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   ├── opensearch/
│   │   └── opensearch.yml
│   └── postgres/
│       └── init.sql
├── docker-compose.yml
├── .env.example
├── .gitignore
└── SETUP.md
```
