#!/bin/bash
# 02-kvm.sh — KVM + libvirt + QEMU + outils virt
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "=== [02-kvm] Installation KVM/libvirt/QEMU ==="

apt-get -y -qq install \
  qemu-system qemu-kvm qemu-utils \
  libvirt-daemon-system libvirt-clients \
  virtinst virt-manager bridge-utils \
  cloud-image-utils genisoimage \
  >/dev/null

# Activation services
systemctl enable --now libvirtd
systemctl enable --now virtlogd

# Ajout vagrant aux groupes libvirt/kvm
usermod -aG libvirt,kvm vagrant || true

# Vérification support virtualisation imbriquée
if egrep -q '(vmx|svm)' /proc/cpuinfo; then
  echo "[02-kvm] CPU supporte la virtualisation matérielle (VT-x/AMD-V)"
else
  echo "[02-kvm] ⚠ Pas de VT-x/AMD-V détecté — KVM utilisera l'émulation (QEMU TCG)"
fi

# Réseau libvirt 'default' (NAT 192.168.122.0/24) — démarre auto
virsh net-autostart default || true
virsh net-start default 2>/dev/null || true

# Réseau libvirt 'vlan10-br' bridgé sur eth1 (VLAN serveurs)
cat <<'EOF' > /tmp/net-vlan10.xml
<network>
  <name>vlan10-br</name>
  <forward mode='bridge'/>
  <bridge name='br-vlan10'/>
</network>
EOF
# Le bridge sera créé dans 05-network.sh — on définit juste le réseau libvirt
virsh net-define /tmp/net-vlan10.xml 2>/dev/null || true

echo "[02-kvm] virsh version : $(virsh --version)"
echo "[02-kvm] qemu version  : $(qemu-system-x86_64 --version | head -1)"
echo "[02-kvm] OK"
