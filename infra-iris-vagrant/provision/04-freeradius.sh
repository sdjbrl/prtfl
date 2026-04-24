#!/bin/bash
# 04-freeradius.sh — FreeRADIUS minimal avec users SISR / SLAM / formateur
# + attribution dynamique de VLAN (Tunnel-Type / Tunnel-Medium-Type / Tunnel-Private-Group-Id)
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "=== [04-freeradius] Installation FreeRADIUS ==="

apt-get -y -qq install freeradius freeradius-utils >/dev/null

CONFDIR=/etc/freeradius/3.0

# Sauvegarde initiale
[[ -f ${CONFDIR}/users.bak ]] || cp ${CONFDIR}/users ${CONFDIR}/users.bak
[[ -f ${CONFDIR}/clients.conf.bak ]] || cp ${CONFDIR}/clients.conf ${CONFDIR}/clients.conf.bak

# ─── Users : 3 profils types avec attribution VLAN dynamique ───
cat <<'EOF' > ${CONFDIR}/users
# RP BTS SIO 2026 — IRIS Mediaschool Nice
# Comptes de démonstration avec attribution dynamique de VLAN
# (Tunnel-Type=VLAN, Tunnel-Medium-Type=IEEE-802, Tunnel-Private-Group-Id=<VID>)

etudiant.sisr  Cleartext-Password := "SisrPass2026"
    Reply-Message := "Bienvenue %{User-Name} (SISR — VLAN 20)",
    Tunnel-Type = VLAN,
    Tunnel-Medium-Type = IEEE-802,
    Tunnel-Private-Group-Id = "20"

etudiant.slam  Cleartext-Password := "SlamPass2026"
    Reply-Message := "Bienvenue %{User-Name} (SLAM — VLAN 30)",
    Tunnel-Type = VLAN,
    Tunnel-Medium-Type = IEEE-802,
    Tunnel-Private-Group-Id = "30"

formateur      Cleartext-Password := "FormaPass2026"
    Reply-Message := "Bienvenue %{User-Name} (Formateur — VLAN 99)",
    Tunnel-Type = VLAN,
    Tunnel-Medium-Type = IEEE-802,
    Tunnel-Private-Group-Id = "99"
EOF

# ─── Clients : autorise 10.10.0.0/16 (NAS = switch / AP / poste local) ───
cat <<'EOF' > ${CONFDIR}/clients.conf
client localhost {
    ipaddr = 127.0.0.1
    secret = testing123
    require_message_authenticator = no
}

client iris-lab {
    ipaddr  = 10.10.0.0/16
    secret  = testing123
    nas_type = other
    shortname = iris-lab
    require_message_authenticator = no
}
EOF

# Ouverture du port 1812/UDP
chown -R freerad:freerad ${CONFDIR}
systemctl enable freeradius
systemctl restart freeradius

# Test local
sleep 2
echo "[04-freeradius] Test auth locale (etudiant.sisr) :"
radtest etudiant.sisr SisrPass2026 127.0.0.1 0 testing123 \
  | grep -E "Access-Accept|Access-Reject|Tunnel-Private-Group-Id" || true

echo "[04-freeradius] OK — écoute sur 10.10.10.10:1812/udp"
