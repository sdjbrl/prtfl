#!/bin/bash
# ============================================================
#  VPS saiddev — Install Docker + Traefik + GLPI + Nextcloud
#  IP : 64.31.63.114
#  Usage : bash install.sh
# ============================================================
set -euo pipefail

DOMAIN_GLPI="glpi.saiddev.fr"
DOMAIN_NEXTCLOUD="nextcloud.saiddev.fr"
ACME_EMAIL="said@saiddev.fr"

BASE_DIR="/opt/saiddev"
TRAEFIK_DIR="$BASE_DIR/traefik"
GLPI_DIR="$BASE_DIR/glpi"
NEXTCLOUD_DIR="$BASE_DIR/nextcloud"

echo "======================================================"
echo "  VPS saiddev — Setup GLPI + Nextcloud"
echo "======================================================"

# ── 1. Mise à jour système ─────────────────────────────────
echo "[1/6] Mise à jour système..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl git wget htop unzip

# ── 2. Docker Engine ───────────────────────────────────────
echo "[2/6] Installation Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
docker --version

# ── 3. Arborescence ───────────────────────────────────────
echo "[3/6] Création des répertoires..."
mkdir -p "$TRAEFIK_DIR/acme"
mkdir -p "$GLPI_DIR"/{mariadb-data,glpi-data,glpi-log,glpi-plugins}
mkdir -p "$NEXTCLOUD_DIR"/{nextcloud-data,postgres-data}
touch "$TRAEFIK_DIR/acme/acme.json"
chmod 600 "$TRAEFIK_DIR/acme/acme.json"

# ── 4. Réseau Docker partagé ──────────────────────────────
echo "[4/6] Réseau Docker..."
docker network create traefik-net 2>/dev/null || true

# ── 5. Traefik ────────────────────────────────────────────
echo "[5/6] Configuration Traefik..."
cat > "$TRAEFIK_DIR/traefik.yml" <<EOF
api:
  dashboard: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  docker:
    exposedByDefault: false
    network: traefik-net

certificatesResolvers:
  letsencrypt:
    acme:
      email: ${ACME_EMAIL}
      storage: /acme/acme.json
      tlsChallenge: {}
EOF

cat > "$TRAEFIK_DIR/docker-compose.yml" <<EOF
services:
  traefik:
    image: traefik:v3.3
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./acme/acme.json:/acme/acme.json
    networks:
      - traefik-net

networks:
  traefik-net:
    external: true
EOF

docker compose -f "$TRAEFIK_DIR/docker-compose.yml" up -d

# ── 6. GLPI ───────────────────────────────────────────────
echo "[6/6] Déploiement GLPI..."

MARIADB_ROOT_PASS="$(openssl rand -base64 20)"
MARIADB_GLPI_PASS="$(openssl rand -base64 20)"

cat > "$GLPI_DIR/docker-compose.yml" <<EOF
services:
  mariadb:
    image: mariadb:11.4
    container_name: glpi-db
    restart: unless-stopped
    environment:
      MARIADB_ROOT_PASSWORD: ${MARIADB_ROOT_PASS}
      MARIADB_DATABASE: glpi
      MARIADB_USER: glpi
      MARIADB_PASSWORD: ${MARIADB_GLPI_PASS}
    volumes:
      - ./mariadb-data:/var/lib/mysql
    networks:
      - traefik-net
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

  glpi:
    image: diouxx/glpi:latest
    container_name: glpi-app
    restart: unless-stopped
    environment:
      MARIADB_HOST: mariadb
      MARIADB_PORT: 3306
      MARIADB_DATABASE: glpi
      MARIADB_USER: glpi
      MARIADB_PASSWORD: ${MARIADB_GLPI_PASS}
      GLPI_LANG: fr_FR
      TZ: Europe/Paris
    volumes:
      - ./glpi-data:/var/www/html/glpi/files
      - ./glpi-log:/var/www/html/glpi/log
      - ./glpi-plugins:/var/www/html/glpi/plugins
    depends_on:
      mariadb:
        condition: service_healthy
    networks:
      - traefik-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.glpi.rule=Host(\`${DOMAIN_GLPI}\`)"
      - "traefik.http.routers.glpi.entrypoints=websecure"
      - "traefik.http.routers.glpi.tls.certresolver=letsencrypt"
      - "traefik.http.services.glpi.loadbalancer.server.port=80"

networks:
  traefik-net:
    external: true
EOF

# Sauvegarde des credentials
cat > "$GLPI_DIR/.credentials" <<EOF
MARIADB_ROOT_PASSWORD=${MARIADB_ROOT_PASS}
MARIADB_GLPI_PASSWORD=${MARIADB_GLPI_PASS}
EOF
chmod 600 "$GLPI_DIR/.credentials"

docker compose -f "$GLPI_DIR/docker-compose.yml" up -d

echo ""
echo "======================================================"
echo "  Installation GLPI terminée !"
echo "======================================================"
echo ""
echo "  Credentials GLPI MariaDB → $GLPI_DIR/.credentials"
echo ""
echo "  ⚠️  DNS à configurer AVANT de démarrer Nextcloud :"
echo "     glpi.saiddev.fr       → 64.31.63.114"
echo "     nextcloud.saiddev.fr  → 64.31.63.114"
echo ""
echo "  Ensuite : bash /opt/saiddev/nextcloud/deploy-nextcloud.sh"
echo "======================================================"
