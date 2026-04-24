# Lab Vagrant — Infrastructure IRIS (RP BTS SIO 2026)

Reproduction opérationnelle du serveur de virtualisation et de l'infrastructure
réseau sécurisée déployés à l'**école IRIS Mediaschool Nice** dans le cadre de
la RP BTS SIO 2026 (Saïd AHMED MOUSSA — option SISR).

> Ce lab permet au jury (E5 / E6) de **rejouer** le déploiement en une seule
> commande sur n'importe quel poste Windows / macOS / Linux disposant de
> Vagrant + VirtualBox.

## Architecture déployée

```
                           ┌─────────────────────────────────────────────────┐
                           │  srv-iris   (Debian 12 — 4 vCPU / 4 Go RAM)     │
                           │                                                 │
   eth1 ── VLAN 10 ───────►│  10.10.10.10/24   KVM/libvirt + Docker + RADIUS │
   eth2 ── VLAN 20 ───────►│  10.10.20.1/24    (gateway postes étudiants)    │
   eth3 ── VLAN 30 ───────►│  10.10.30.1/24    (gateway WiFi étudiants)      │
                           └─────────────────────────────────────────────────┘
                                                    ▲
                           ┌─────────────────────────────────────────────────┐
   eth1 ── VLAN 20 ───────►│  poste-sisr  (Debian 12 — 1 vCPU / 1 Go RAM)    │
                           │  10.10.20.20/24   client RADIUS (radtest)       │
                           └─────────────────────────────────────────────────┘
```

| Composant logiciel | Rôle | Couvre |
|---|---|---|
| Debian 12 Bookworm | OS hôte | Choix techniques §3.1 |
| KVM / QEMU / libvirt | Hyperviseur type 1 | Choix techniques §3.2 |
| Docker Engine + Compose v2 | Conteneurisation + démo nginx | Choix techniques §3.3 |
| FreeRADIUS 3 | Auth 802.1X + attribution dynamique de VLAN | Sécurisation §2.4 |
| iptables + IP forwarding | Routage inter-VLAN + NAT sortant | §2.3 / §2.4 |

Les **VLANs Cisco** (2960-S, C9105-AXI, ISR 1941) sont simulés par des
**réseaux internes VirtualBox** (`vlan10`, `vlan20`, `vlan30`) — l'attribution
dynamique de VLAN est démontrée côté RADIUS via les attributs
`Tunnel-Type / Tunnel-Medium-Type / Tunnel-Private-Group-Id`.

## Prérequis

- **Vagrant** ≥ 2.4
- **VirtualBox** ≥ 7.0
- ~6 Go de RAM disponible · ~10 Go de disque
- CPU avec **VT-x** ou **AMD-V** (sinon KVM tournera en mode TCG, plus lent)

## Mise en service

```bash
cd infra-iris-vagrant
vagrant up                 # ~8 min la 1re fois (téléchargement box + provisioning)
vagrant ssh srv-iris       # se connecter au serveur
```

Le script `99-validate.sh` s'exécute automatiquement en fin de provisioning et
affiche un récapitulatif `[OK] / [KO]` de chaque composant.

## Démonstrations (E6 — challenge technique B3)

### 1. Authentification RADIUS individuelle (depuis un poste étudiant)

```bash
vagrant ssh poste-sisr

# Étudiant SISR → Access-Accept + VLAN 20
radtest etudiant.sisr SisrPass2026 10.10.10.10 0 testing123

# Étudiant SLAM → Access-Accept + VLAN 30
radtest etudiant.slam SlamPass2026 10.10.10.10 0 testing123

# Formateur → Access-Accept + VLAN 99
radtest formateur    FormaPass2026 10.10.10.10 0 testing123

# Mauvais mot de passe → Access-Reject (traçable dans /var/log/freeradius/)
radtest etudiant.sisr WRONGPASS    10.10.10.10 0 testing123
```

L'attribut `Tunnel-Private-Group-Id` renvoyé par RADIUS pilote l'attribution
dynamique de VLAN : c'est ce mécanisme que les switches Catalyst 2960-S et les
AP C9105-AXI utilisent en production pour **placer chaque utilisateur sur le
bon VLAN selon son profil**.

### 2. Hyperviseur KVM opérationnel

```bash
vagrant ssh srv-iris
sudo virsh list --all          # liste des VMs
sudo virsh net-list --all      # réseaux libvirt
sudo virsh capabilities | head # capacités hyperviseur
```

Pour créer une VM de démo :
```bash
sudo virt-install \
  --name demo-debian --memory 1024 --vcpus 1 \
  --disk size=8 --network bridge=br-vlan10 \
  --location http://deb.debian.org/debian/dists/bookworm/main/installer-amd64/ \
  --extra-args "console=ttyS0,115200" --noautoconsole
```

### 3. Service Docker exposé sur VLAN 10

```bash
# Depuis poste-sisr (VLAN 20) — la requête est routée par srv-iris
curl http://10.10.10.10/

# Statut du conteneur
vagrant ssh srv-iris -c "docker ps && docker compose -f /opt/iris-demo/docker-compose.yml ps"
```

### 4. Tracabilité des accès (preuve §3 du dossier)

```bash
sudo tail -f /var/log/freeradius/radius.log
sudo tail -f /var/log/freeradius/radacct/*/auth-detail-*
```

## Couverture du référentiel BTS SIO

| Bloc | Compétence | Démonstration concrète |
|---|---|---|
| **B1.1** | Gérer le patrimoine informatique | Inventaire VMs/conteneurs (`virsh list`, `docker ps`) |
| **B1.3** | Répondre aux incidents | Logs centralisés `/var/log/freeradius`, `journalctl -u libvirtd` |
| **B2.1** | Concevoir une infra réseau | Schéma VLANs §2 + script `05-network.sh` |
| **B2.2** | Installer / déployer | `vagrant up` reproductible, IaC complet |
| **B2.3** | Exploiter / superviser | `99-validate.sh`, `journalctl`, `systemctl` |
| **B3.1** | Protéger les données | Auth individuelle, mots de passe `Cleartext-Password` (à migrer EAP-TLS) |
| **B3.2** | Préserver l'identité numérique | Compte par utilisateur, attribution VLAN par profil |
| **B3.3** | Sécuriser les équipements | NAT sortant, segmentation iptables |
| **B3.4** | Garantir disponibilité / intégrité | Snapshots KVM, `docker compose restart`, validation auto |

## Arrêt et nettoyage

```bash
vagrant halt              # éteindre les 2 VMs
vagrant destroy -f        # tout supprimer
```

## Limites assumées du lab

| Production IRIS | Lab Vagrant |
|---|---|
| WPA3-Enterprise sur AP Cisco C9105-AXI | Auth RADIUS testée via `radtest` (PAP) |
| 802.1X port-based sur Catalyst 2960-S | VLANs simulés par réseaux internes VirtualBox |
| Trunk 802.1Q vers routeur ISR 1941 | NAT VirtualBox vers Internet |
| 60 VMs SISR + 30 conteneurs SLAM | 1 VM démo + 1 conteneur nginx |

Ces limites n'altèrent pas la validité pédagogique : **toute la stack logicielle
(Debian, KVM, libvirt, Docker, FreeRADIUS) est strictement identique à celle
en production** — seul le matériel réseau Cisco est remplacé par son
équivalent virtuel.

---

**Auteur :** Saïd AHMED MOUSSA · BTS SIO SISR · IRIS Mediaschool Nice · Session 2026
