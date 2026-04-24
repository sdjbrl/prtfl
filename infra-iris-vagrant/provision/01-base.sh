#!/bin/bash
# 01-base.sh — Préparation système Debian 12
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "=== [01-base] Mise à jour & paquets de base ==="
apt-get update -qq
apt-get -y -qq upgrade >/dev/null
apt-get -y -qq install \
  ca-certificates curl gnupg lsb-release \
  vim htop tmux tree net-tools dnsutils \
  bridge-utils vlan iproute2 iptables \
  sudo openssh-server git unzip jq \
  >/dev/null

# Activer 8021q (VLAN)
modprobe 8021q || true
grep -q "^8021q" /etc/modules || echo "8021q" >> /etc/modules

# Bannière d'accueil
cat <<'EOF' > /etc/motd

╔══════════════════════════════════════════════════════════════════╗
║  srv-iris — Hyperviseur KVM + Docker + FreeRADIUS                ║
║  RP BTS SIO 2026 — Saïd AHMED MOUSSA                             ║
║                                                                  ║
║  VLANs simulés :                                                 ║
║    eth1 → VLAN 10 (Serveurs)         10.10.10.10/24              ║
║    eth2 → VLAN 20 (Postes étudiants) 10.10.20.1/24               ║
║    eth3 → VLAN 30 (WiFi étudiants)   10.10.30.1/24               ║
║                                                                  ║
║  Commandes utiles :                                              ║
║    sudo virsh list --all     # VMs KVM                           ║
║    docker ps                 # Conteneurs                        ║
║    sudo systemctl status freeradius                              ║
╚══════════════════════════════════════════════════════════════════╝

EOF

echo "[01-base] OK"
