# Setup Guide - Produktbewertungs-Plattform

## Voraussetzungen

- Docker Engine 20.10+ installiert
- Docker Compose V2 installiert
- Mindestens 4GB freier RAM
- Ports 80, 3000, 5173, 5432, 6379, 9200, 9600 verfügbar

## Setup (5 Schritte)

### 1. Repository klonen und in Verzeichnis wechseln
```bash
cd /path/to/bp
```

### 2. Umgebungsvariablen konfigurieren
```bash
cp .env.example .env
```
Optional: `.env` anpassen (Standard-Werte funktionieren out-of-the-box)

### 3. Alle Services starten
```bash
docker-compose up -d
```

### 4. Warten bis alle Services healthy sind (ca. 15-30 Sekunden)
```bash
docker-compose ps
```
Alle Services sollten Status `Up` und `healthy` haben.

### 5. Validierung durchführen
```bash
# Nginx erreichbar
curl http://localhost:80/health

# OpenSearch erreichbar
curl http://localhost:9200

# PostgreSQL verbinden
docker-compose exec postgres psql -U postgres -d product_platform -c "SELECT 1;"

# Redis testen
docker-compose exec redis redis-cli ping

# Backend Environment prüfen
docker-compose exec backend env | grep DATABASE_URL
```

## Port-Übersicht

| Service     | Port(s)      | URL                          |
|-------------|--------------|------------------------------|
| Nginx       | 80           | http://localhost:80          |
| Backend     | 3000         | http://localhost:3000        |
| Frontend    | 5173         | http://localhost:5173        |
| PostgreSQL  | 5432         | postgres://localhost:5432    |
| Redis       | 6379         | redis://localhost:6379       |
| OpenSearch  | 9200, 9600   | http://localhost:9200        |

## Nützliche Befehle

### Services verwalten
```bash
# Alle Services starten
docker-compose up -d

# Alle Services stoppen
docker-compose down

# Services stoppen UND Volumes löschen
docker-compose down -v

# Services neu bauen
docker-compose up -d --build

# Einzelnen Service neu starten
docker-compose restart postgres
```

### Logs anzeigen
```bash
# Alle Logs live verfolgen
docker-compose logs -f

# Logs eines Services
docker-compose logs -f postgres

# Letzte 100 Zeilen
docker-compose logs --tail=100

# Logs ohne Timestamps
docker-compose logs --no-log-prefix
```

### In Container einloggen
```bash
# PostgreSQL
docker-compose exec postgres psql -U postgres -d product_platform

# Redis CLI
docker-compose exec redis redis-cli

# Backend Shell
docker-compose exec backend sh

# Frontend Shell
docker-compose exec frontend sh
```

### Status prüfen
```bash
# Alle Services und deren Status
docker-compose ps

# Detaillierte Service-Info
docker-compose ps --services

# Resource-Nutzung
docker stats
```

## Troubleshooting

### Problem: Service startet nicht (unhealthy)
```bash
# Logs des betroffenen Services prüfen
docker-compose logs SERVICE_NAME

# Service einzeln neu starten
docker-compose restart SERVICE_NAME

# Komplett neu aufsetzen
docker-compose down -v
docker-compose up -d
```

### Problem: Port bereits belegt
```bash
# Prüfen welcher Prozess Port nutzt (macOS/Linux)
lsof -i :PORT_NUMBER

# Prozess beenden oder Port in docker-compose.yml ändern
# Beispiel: "8080:5432" statt "5432:5432" für PostgreSQL
```

### Problem: OpenSearch startet nicht (memory issues)
```bash
# Mehr Memory zuweisen (in docker-compose.yml)
# Unter opensearch.environment:
# - OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g

# Oder vm.max_map_count erhöhen (Linux)
sudo sysctl -w vm.max_map_count=262144
```

### Problem: Volumes beschädigt
```bash
# Alle Container und Volumes löschen (ACHTUNG: Datenverlust!)
docker-compose down -v

# Neu starten
docker-compose up -d
```

### Problem: Netzwerk-Fehler zwischen Services
```bash
# Prüfen ob alle Services im gleichen Netzwerk sind
docker network inspect product-platform-network

# DNS-Auflösung testen
docker-compose exec backend ping postgres
docker-compose exec backend ping redis
```

### Problem: Nginx 502 Bad Gateway
```bash
# Prüfen ob Backend/Frontend erreichbar sind
docker-compose logs backend
docker-compose logs frontend

# Nginx Config testen
docker-compose exec nginx nginx -t

# Nginx neu laden
docker-compose restart nginx
```

## Datenbank-Zugriff

### Mit psql (im Container)
```bash
docker-compose exec postgres psql -U postgres -d product_platform
```

### Mit externem Client
```
Host: localhost
Port: 5432
User: postgres
Password: postgres
Database: product_platform
```

## OpenSearch-Zugriff

### Health Check
```bash
curl http://localhost:9200/_cluster/health?pretty
```

### Indices anzeigen
```bash
curl http://localhost:9200/_cat/indices?v
```

## Redis-Zugriff

### Keys anzeigen
```bash
docker-compose exec redis redis-cli KEYS '*'
```

### Key auslesen
```bash
docker-compose exec redis redis-cli GET key_name
```

## Nächste Schritte (Phase 1)

Nach erfolgreichem Setup:
1. NestJS Backend in `backend/` entwickeln
2. Vue3 Frontend in `frontend/` entwickeln
3. `docker-compose.yml` um Volume-Mounts für Source-Code erweitern
4. Hot-Reload für Development aktivieren

## Support

Bei Problemen:
1. Logs prüfen: `docker-compose logs -f`
2. Service-Status prüfen: `docker-compose ps`
3. Validierungs-Befehle ausführen (siehe Schritt 5)
4. Troubleshooting-Abschnitt konsultieren
