#!/bin/bash
# 99-validate.sh — Tests de validation post-provisioning
set -uo pipefail

OK="\033[1;32m[OK]\033[0m"
KO="\033[1;31m[KO]\033[0m"
pass=0; fail=0
check() {
  if eval "$2" &>/dev/null; then
    echo -e "$OK $1"; pass=$((pass+1))
  else
    echo -e "$KO $1"; fail=$((fail+1))
  fi
}

echo
echo "═══════════════════════════════════════════════════════════"
echo " VALIDATION INFRA IRIS — RP BTS SIO 2026"
echo "═══════════════════════════════════════════════════════════"

check "Module kernel KVM chargé"               "lsmod | grep -E '^(kvm|kvm_intel|kvm_amd)'"
check "Service libvirtd actif"                 "systemctl is-active libvirtd"
check "virsh fonctionnel"                      "virsh list --all"
check "Service docker actif"                   "systemctl is-active docker"
check "Conteneur web-iris up"                  "docker ps --format '{{.Names}}' | grep -q web-iris"
check "Service freeradius actif"               "systemctl is-active freeradius"
check "Port RADIUS 1812/udp à l'écoute"        "ss -lunp | grep -q ':1812'"
check "IP forwarding activé"                   "[ \$(cat /proc/sys/net/ipv4/ip_forward) = 1 ]"
check "VLAN 10 (10.10.10.10) accessible"       "ip -4 addr show | grep -q '10.10.10.10'"
check "VLAN 20 (10.10.20.1) accessible"        "ip -4 addr show | grep -q '10.10.20.1'"
check "VLAN 30 (10.10.30.1) accessible"        "ip -4 addr show | grep -q '10.10.30.1'"
check "RADIUS auth etudiant.sisr → Accept"     "radtest etudiant.sisr SisrPass2026 127.0.0.1 0 testing123 | grep -q Access-Accept"
check "RADIUS auth mauvais mdp → Reject"       "radtest etudiant.sisr WRONG       127.0.0.1 0 testing123 | grep -q Access-Reject"
check "HTTP web-iris répond"                   "curl -fsS http://10.10.10.10/ | grep -q 'opérationnel'"

echo
echo " Résumé : ${pass} OK · ${fail} KO"
echo "═══════════════════════════════════════════════════════════"
[ $fail -eq 0 ]
