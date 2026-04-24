#!/bin/bash
# 05-network.sh — Routage inter-VLAN + NAT sortant + bridge KVM
set -euo pipefail

echo "=== [05-network] Configuration routage / NAT ==="

# Activer l'IP forwarding (routage entre VLAN 10/20/30)
sed -i 's/^#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
grep -q '^net.ipv4.ip_forward=1' /etc/sysctl.conf || \
  echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
sysctl -p >/dev/null

# NAT sortant pour les postes étudiants via l'interface NAT Vagrant (eth0)
iptables -t nat -C POSTROUTING -s 10.10.20.0/24 -o eth0 -j MASQUERADE 2>/dev/null \
  || iptables -t nat -A POSTROUTING -s 10.10.20.0/24 -o eth0 -j MASQUERADE
iptables -t nat -C POSTROUTING -s 10.10.30.0/24 -o eth0 -j MASQUERADE 2>/dev/null \
  || iptables -t nat -A POSTROUTING -s 10.10.30.0/24 -o eth0 -j MASQUERADE

# Persister iptables
apt-get -y -qq install iptables-persistent >/dev/null
netfilter-persistent save >/dev/null

# Bridge dédié VLAN 10 pour les VMs KVM (utilise eth1)
if ! ip link show br-vlan10 &>/dev/null; then
  ip link add name br-vlan10 type bridge
  ip link set br-vlan10 up
  echo "[05-network] bridge br-vlan10 créé (les VMs KVM peuvent y être rattachées)"
fi

echo "[05-network] OK"
