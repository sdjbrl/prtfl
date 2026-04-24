#!/bin/bash
# ============================================================
#  VPS saiddev — Déploiement Nextcloud 28
#  À lancer APRÈS avoir configuré le DNS
#  Usage : bash deploy-nextcloud.sh
# ============================================================
set -euo pipefail

DOMAIN_NEXTCLOUD="nextcloud.saiddev.fr"
NEXTCLOUD_DIR="/opt/saiddev/nextcloud"

NC_ADMIN_USER="admin"
NC_ADMIN_PASS="$(openssl rand -base64 16)"
PG_PASS="$(openssl rand -base64 20)"
REDIS_PASS="$(openssl rand -base64 20)"

mkdir -p "$NEXTCLOUD_DIR"/{nextcloud-data,postgres-data}

cat > "$NEXTCLOUD_DIR/docker-compose.yml" <<EOF
services:
  postgres:
    image: postgres:15-alpine
    container_name: nc-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: nextcloud
      POSTGRES_USER: nextcloud
      POSTGRES_PASSWORD: ${PG_PASS}
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    networks:
      - traefik-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nextcloud"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: nc-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASS}
    networks:
      - traefik-net
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASS}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nextcloud:
    image: nextcloud:28-apache
    container_name: nc-app
    restart: unless-stopped
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_DB: nextcloud
      POSTGRES_USER: nextcloud
      POSTGRES_PASSWORD: ${PG_PASS}
      REDIS_HOST: redis
      REDIS_HOST_PASSWORD: ${REDIS_PASS}
      NEXTCLOUD_ADMIN_USER: ${NC_ADMIN_USER}
      NEXTCLOUD_ADMIN_PASSWORD: ${NC_ADMIN_PASS}
      NEXTCLOUD_TRUSTED_DOMAINS: "${DOMAIN_NEXTCLOUD}"
      OVERWRITEPROTOCOL: https
      OVERWRITECLIURL: "https://${DOMAIN_NEXTCLOUD}"
      TZ: Europe/Paris
    volumes:
      - ./nextcloud-data:/var/www/html
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - traefik-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.nextcloud.rule=Host(\`${DOMAIN_NEXTCLOUD}\`)"
      - "traefik.http.routers.nextcloud.entrypoints=websecure"
      - "traefik.http.routers.nextcloud.tls.certresolver=letsencrypt"
      - "traefik.http.services.nextcloud.loadbalancer.server.port=80"
      - "traefik.http.middlewares.nc-redirect.redirectregex.regex=/.well-known/(card|cal)dav"
      - "traefik.http.middlewares.nc-redirect.redirectregex.replacement=/remote.php/dav/"
      - "traefik.http.routers.nextcloud.middlewares=nc-redirect"

networks:
  traefik-net:
    external: true
EOF

# Credentials
cat > "$NEXTCLOUD_DIR/.credentials" <<EOF
NEXTCLOUD_ADMIN_USER=${NC_ADMIN_USER}
NEXTCLOUD_ADMIN_PASSWORD=${NC_ADMIN_PASS}
POSTGRES_PASSWORD=${PG_PASS}
REDIS_PASSWORD=${REDIS_PASS}
EOF
chmod 600 "$NEXTCLOUD_DIR/.credentials"

docker compose -f "$NEXTCLOUD_DIR/docker-compose.yml" up -d

echo ""
echo "======================================================"
echo "  Nextcloud déployé !"
echo "======================================================"
echo ""
echo "  URL    : https://${DOMAIN_NEXTCLOUD}"
echo "  Admin  : ${NC_ADMIN_USER}"
echo "  Pass   : ${NC_ADMIN_PASS}"
echo ""
echo "  Credentials complets → $NEXTCLOUD_DIR/.credentials"
echo "======================================================"
