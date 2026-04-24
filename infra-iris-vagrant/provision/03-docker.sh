#!/bin/bash
# 03-docker.sh — Docker Engine + Compose v2 + démo nginx
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "=== [03-docker] Installation Docker Engine ==="

# Repo Docker officiel
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

CODENAME=$(. /etc/os-release && echo "${VERSION_CODENAME}")
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian ${CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -qq
apt-get -y -qq install \
  docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin \
  >/dev/null

systemctl enable --now docker
usermod -aG docker vagrant || true

# Démo : nginx exposé sur 10.10.10.10:80 (VLAN serveurs)
mkdir -p /opt/iris-demo
cat <<'EOF' > /opt/iris-demo/docker-compose.yml
services:
  web-iris:
    image: nginx:alpine
    container_name: web-iris
    restart: unless-stopped
    ports:
      - "10.10.10.10:80:80"
    volumes:
      - ./html:/usr/share/nginx/html:ro
EOF

mkdir -p /opt/iris-demo/html
cat <<'HTML' > /opt/iris-demo/html/index.html
<!doctype html>
<title>IRIS — Service conteneurisé</title>
<style>body{font-family:sans-serif;margin:3rem;color:#222}</style>
<h1>✅ Service Docker IRIS opérationnel</h1>
<p>Conteneur <code>nginx:alpine</code> exposé sur <code>10.10.10.10:80</code>
(VLAN 10 — Serveurs).</p>
<p>Hébergé par <code>srv-iris</code> · Debian 12 + Docker Engine.</p>
HTML

cd /opt/iris-demo
docker compose up -d

echo "[03-docker] $(docker --version)"
echo "[03-docker] $(docker compose version)"
echo "[03-docker] OK"
