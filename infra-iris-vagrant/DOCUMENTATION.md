# DOCUMENTATION TECHNIQUE — Lab Vagrant Infrastructure IRIS

> Document d'architecture et de référence détaillant l'ensemble des choix
> d'implémentation du lab. Complète le `README.md` (synthèse) et le
> `GUIDE.md` (mise en œuvre).

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture détaillée](#2-architecture-détaillée)
3. [Choix techniques justifiés](#3-choix-techniques-justifiés)
4. [Description des composants](#4-description-des-composants)
5. [Plan d'adressage et VLANs](#5-plan-dadressage-et-vlans)
6. [Sécurité](#6-sécurité)
7. [Cycle de vie & exploitation](#7-cycle-de-vie--exploitation)
8. [Mapping référentiel BTS SIO](#8-mapping-référentiel-bts-sio)
9. [Limites et écarts avec la production](#9-limites-et-écarts-avec-la-production)
10. [Évolutions possibles](#10-évolutions-possibles)
11. [Annexes](#11-annexes)

---

## 1. Vue d'ensemble

Ce lab Vagrant matérialise — sur un poste de travail unique — l'infrastructure
réseau sécurisée déployée à l'**école IRIS Mediaschool Nice** (RP BTS SIO 2026).

Il poursuit trois objectifs :

| Objectif | Bénéfice jury |
|---|---|
| **Reproductibilité** | Le jury peut rejouer l'intégralité de la mise en service en une commande (`vagrant up`). |
| **Démonstrabilité** | Chaque service (KVM, Docker, RADIUS) est testable individuellement par des commandes documentées. |
| **Auditabilité** | Toute la configuration est en code versionné (Infrastructure as Code) — pas de "magie" cachée. |

Stack technique : **Vagrant** (orchestration) + **VirtualBox** (hyperviseur de
développement) + **Debian 12 Bookworm** (OS cible) + **Bash provisioning**
(scripts idempotents).

---

## 2. Architecture détaillée

### 2.1 Topologie

```
   Hôte (Windows / macOS / Linux)
   │
   │  Vagrant + VirtualBox 7
   │
   ├──── VM srv-iris (Debian 12)  ─────────────────────────────────┐
   │      eth0  ──► NAT VirtualBox  (Internet, accès SSH par fwd)  │
   │      eth1  ──► intnet "vlan10"  10.10.10.10/24  ─ Serveurs    │
   │      eth2  ──► intnet "vlan20"  10.10.20.1/24   ─ Postes      │
   │      eth3  ──► intnet "vlan30"  10.10.30.1/24   ─ WiFi        │
   │      Services : libvirtd, dockerd, freeradius, iptables (NAT) │
   │                                                                │
   └──── VM poste-sisr (Debian 12) ─────────────────────────────────┤
          eth0  ──► NAT VirtualBox                                   │
          eth1  ──► intnet "vlan20"  10.10.20.20/24                  │
          Outils : freeradius-utils (radtest), curl                  │
                                                                     │
   Réseaux internes VirtualBox (isolés, pas d'accès depuis l'hôte) ──┘
```

### 2.2 Correspondance avec la production IRIS

| Élément production | Équivalent lab |
|---|---|
| Serveur Dell PowerEdge R740 | VM `srv-iris` (4 vCPU / 4 Go) |
| Switch Catalyst 2960-S 24 ports | Réseaux internes VirtualBox `vlan10/20/30` |
| AP Cisco C9105AXI (WiFi étudiants) | Pas matérialisé (l'auth RADIUS est démontrée par `radtest`) |
| Routeur ISR 1941 | NAT VirtualBox + iptables MASQUERADE sur srv-iris |
| Postes étudiants Windows 10 | VM `poste-sisr` (Debian 12 minimal) |

---

## 3. Choix techniques justifiés

### 3.1 Pourquoi Debian 12 ?

| Critère | Raison |
|---|---|
| **Stabilité** | Cycle de release prévisible, support 5 ans (LTS via Freexian) |
| **Légèreté** | Empreinte mémoire minimale (~150 Mo idle) |
| **Disponibilité KVM** | Modules `kvm-intel` / `kvm-amd` dans le kernel mainline |
| **Identique production** | Strictement la même distribution qu'à IRIS |

### 3.2 Pourquoi KVM (et pas VMware / Hyper-V) ?

| Critère | KVM | VMware ESXi | Hyper-V |
|---|---|---|---|
| Coût | ✅ Libre / GPL | ❌ Licence | 🟡 Inclus Win Pro/Server |
| Performance | ✅ Quasi-natif (paravirt) | ✅ | ✅ |
| Intégration Linux | ✅ Module kernel | 🟡 ESXi standalone | ❌ |
| API d'automatisation | ✅ libvirt + virsh | 🟡 vSphere SDK (lourd) | 🟡 PowerShell |
| Conformité IRIS | ✅ Choisi en production | — | — |

### 3.3 Pourquoi Docker en plus de KVM ?

L'école a besoin de **deux niveaux d'isolation** :

- **VMs KVM** pour les TPs SISR (Windows Server, Debian, Cisco IOS-on-Linux)
  → isolation matérielle, snapshots, restauration rapide.
- **Conteneurs Docker** pour les TPs SLAM (LAMP, Node, Python, MariaDB)
  → démarrage en quelques secondes, faible empreinte, image immuable.

Cette dualité est reproduite à l'identique dans le lab.

### 3.4 Pourquoi FreeRADIUS ?

- **Standard de fait** pour l'authentification 802.1X (WPA2/3-Enterprise) ;
- Compatible Cisco / Aruba / Ubiquiti / etc. (langage AVP normalisé) ;
- Permet l'**attribution dynamique de VLAN** via les attributs RFC 3580
  (`Tunnel-Type`, `Tunnel-Medium-Type`, `Tunnel-Private-Group-Id`) ;
- Disponible en paquet Debian (`apt install freeradius`).

### 3.5 Pourquoi Vagrant + VirtualBox (pour le lab) ?

| Alternative | Pourquoi non retenue |
|---|---|
| Vagrant + libvirt | Ne fonctionne pas nativement sous Windows (jury possiblement sous Win) |
| Docker Compose | Ne permet pas d'imbriquer un vrai KVM (pas d'accès `/dev/kvm`) |
| Terraform + cloud | Coût + dépendance Internet permanente |
| Scripts shell purs | Non reproductible, dépend de l'OS hôte |

**Vagrant + VirtualBox** est le seul combo :
- multi-OS (Windows / macOS / Linux),
- gratuit,
- supportant la **virtualisation imbriquée** (`--nested-hw-virt on`),
- pilotable par un simple fichier Ruby versionnable.

---

## 4. Description des composants

### 4.1 `Vagrantfile`

| Section | Rôle |
|---|---|
| `config.vm.box = "bento/debian-12"` | Image de base Debian 12 maintenue par Bento |
| `srv-iris` | VM serveur (4 CPU, 4 Go RAM, 3 NICs intnet) |
| `poste-sisr` | VM cliente (1 CPU, 1 Go RAM, 1 NIC sur vlan20) |
| `--nested-hw-virt on` | Active VT-x/AMD-V à l'intérieur de la VM (pour KVM imbriqué) |
| `config.vm.provision` | Enchaîne les 6 scripts shell dans l'ordre |

### 4.2 Scripts de provisioning (`provision/`)

Tous les scripts sont **idempotents** (rejouables sans casser l'état).

| Script | Rôle | Idempotent par |
|---|---|---|
| `01-base.sh` | Mise à jour APT, paquets de base, module 8021q, MOTD | `grep -q ... \|\| echo` |
| `02-kvm.sh` | Installe qemu/libvirt/virtinst, démarre libvirtd, ajoute vagrant aux groupes | `systemctl enable --now`, `usermod -aG ... \|\| true` |
| `03-docker.sh` | Repo Docker officiel + Engine + Compose v2 + démo nginx | `docker compose up -d` (safe rerun) |
| `04-freeradius.sh` | Installe FreeRADIUS, écrit `users` + `clients.conf`, teste `radtest` | Sauvegarde `.bak` + écrasement contrôlé |
| `05-network.sh` | IP forwarding + iptables MASQUERADE + bridge `br-vlan10` | `iptables -C ... \|\| iptables -A ...` |
| `99-validate.sh` | 14 tests `[OK]/[KO]` sur tous les composants | Lecture seule |

### 4.3 Configuration FreeRADIUS

**Fichier `/etc/freeradius/3.0/users` :**
```
etudiant.sisr  Cleartext-Password := "SisrPass2026"
    Tunnel-Type = VLAN,
    Tunnel-Medium-Type = IEEE-802,
    Tunnel-Private-Group-Id = "20"
```

**Fichier `/etc/freeradius/3.0/clients.conf` :**
```
client iris-lab {
    ipaddr = 10.10.0.0/16
    secret = testing123
}
```

> ⚠ `Cleartext-Password` est utilisé pour la démo. En production IRIS, on
> migre vers EAP-TLS (certificats clients) pour éviter tout stockage en clair.

### 4.4 Démo Docker

Stack Compose dans `/opt/iris-demo/docker-compose.yml` : un nginx:alpine
exposé sur `10.10.10.10:80` (interface VLAN 10). Page HTML servie depuis
`/opt/iris-demo/html/`.

### 4.5 Routage / NAT

Activé dans `05-network.sh` :
```
sysctl net.ipv4.ip_forward = 1
iptables -t nat -A POSTROUTING -s 10.10.20.0/24 -o eth0 -j MASQUERADE
iptables -t nat -A POSTROUTING -s 10.10.30.0/24 -o eth0 -j MASQUERADE
```

Persistance par `iptables-persistent` (`netfilter-persistent save`).

---

## 5. Plan d'adressage et VLANs

| VLAN | Nom | Sous-réseau | Gateway (srv-iris) | Usage |
|---|---|---|---|---|
| 10 | Serveurs | 10.10.10.0/24 | 10.10.10.10 | VMs KVM, conteneurs Docker, services internes |
| 20 | Postes étudiants | 10.10.20.0/24 | 10.10.20.1 | Postes salle SISR (poste-sisr en démo) |
| 30 | WiFi étudiants | 10.10.30.0/24 | 10.10.30.1 | Clients WiFi authentifiés via 802.1X |
| 99 | Administration | (non matérialisé) | — | Réservé formateurs (attribution RADIUS uniquement) |

**Matrice de flux autorisés :**

| Source ↓ / Dest → | VLAN 10 | VLAN 20 | VLAN 30 | Internet |
|---|---|---|---|---|
| VLAN 10 (Serveurs) | ✅ | ✅ | ✅ | ✅ |
| VLAN 20 (Postes) | ✅ (services métier) | ✅ | ❌ | ✅ via NAT |
| VLAN 30 (WiFi) | 🟡 (HTTP/DNS) | ❌ | ✅ | ✅ via NAT |

> Note : dans le lab, le filtrage inter-VLAN est volontairement permissif
> pour faciliter la démo. En production, ces règles sont implémentées sur
> le routeur ISR 1941 (ACLs) et sur srv-iris (iptables).

---

## 6. Sécurité

### 6.1 Surface d'attaque réduite

- VMs Debian sans interface graphique (économie + moins de CVE)
- Aucun port exposé sur l'hôte sauf SSH Vagrant (forwardé sur 2222/2200)
- Réseaux internes VirtualBox = totalement isolés de l'hôte et d'Internet entrant
- Mots de passe de démo **non utilisables en production** (volontairement faibles)

### 6.2 Authentification individuelle (RGPD)

Chaque accès est tracé dans `/var/log/freeradius/radacct/` avec :
- horodatage,
- identifiant utilisateur (User-Name),
- IP du NAS (poste / AP),
- résultat (Accept/Reject),
- VLAN attribué.

→ Couvre l'exigence **CNIL** d'imputabilité des accès dans un établissement
scolaire (article 32 RGPD : sécurité du traitement).

### 6.3 Bonnes pratiques implémentées

| Pratique | Implémentation |
|---|---|
| Principe du moindre privilège | Compte `vagrant` non-root, `sudo` requis pour toute action sensible |
| Segmentation réseau | 3 VLANs distincts, routage explicite |
| Mots de passe différents par profil | 3 utilisateurs RADIUS = 3 mots de passe |
| Logs centralisés | `journalctl` + `/var/log/freeradius/` |
| Configuration versionnée | Tout est dans Git (Vagrantfile + scripts) |

### 6.4 Limites de sécurité (assumées)

| Limite | Mitigation prévue (production) |
|---|---|
| `Cleartext-Password` dans `users` | Migration EAP-TLS avec PKI interne |
| Secret RADIUS unique `testing123` | Secret par NAS, rotation annuelle |
| Pas de chiffrement disque | LUKS sur partitions `/var` et `/home` |
| Pas de pare-feu inter-VLAN strict | ACLs sur ISR 1941 + nftables sur srv-iris |

---

## 7. Cycle de vie & exploitation

### 7.1 États d'une VM Vagrant

```
not_created  ──vagrant up──►  running
running      ──vagrant halt──►  poweroff
running      ──vagrant suspend──►  saved
saved        ──vagrant resume──►  running
*            ──vagrant destroy──►  not_created
```

### 7.2 Commandes d'exploitation

| Tâche | Commande |
|---|---|
| État des VMs | `vagrant status` |
| SSH dans une VM | `vagrant ssh srv-iris` |
| Redémarrer une VM | `vagrant reload srv-iris` |
| Réexécuter le provisioning | `vagrant provision srv-iris` |
| Snapshot avant manip risquée | `vagrant snapshot save srv-iris pre-test` |
| Restaurer un snapshot | `vagrant snapshot restore srv-iris pre-test` |
| Supprimer un snapshot | `vagrant snapshot delete srv-iris pre-test` |

### 7.3 Sauvegarde

Les données critiques (config FreeRADIUS, docker-compose, scripts) sont
**dans Git** : la perte d'une VM est sans conséquence — `vagrant destroy && vagrant up`
restitue un état identique.

Pour les VMs créées **dans** srv-iris (KVM) : utiliser `virsh dumpxml` +
`virsh snapshot-create-as`.

---

## 8. Mapping référentiel BTS SIO

| Bloc | Compétence | Élément du lab qui l'illustre |
|---|---|---|
| **B1.1** | Gérer le patrimoine informatique | `virsh list --all`, `docker ps`, `vagrant status` |
| **B1.2** | Répondre aux incidents et demandes | Logs `journalctl -u <service>`, `radius.log` |
| **B1.3** | Développer la présence en ligne | `web-iris` (nginx) sur VLAN 10 |
| **B2.1** | Concevoir une infrastructure réseau | Plan d'adressage §5, schéma §2 |
| **B2.2** | Installer / configurer | `vagrant up` IaC complet |
| **B2.3** | Exploiter / superviser | `99-validate.sh`, `systemctl`, `journalctl` |
| **B3.1** | Protéger les données | Auth RADIUS individuelle, NAT, segmentation |
| **B3.2** | Préserver l'identité numérique | Comptes nominatifs, attribution VLAN par profil |
| **B3.3** | Sécuriser les équipements et services | Firewall iptables, services minimaux |
| **B3.4** | Garantir disponibilité, intégrité, confidentialité | Snapshots Vagrant + KVM, validation auto |

---

## 9. Limites et écarts avec la production

| Aspect | Production IRIS | Lab Vagrant |
|---|---|---|
| Switch L2 | Cisco Catalyst 2960-S, 802.1Q natif | Réseaux internes VirtualBox (intnet) |
| WiFi 802.1X | AP Cisco C9105-AXI + WPA3-Enterprise | Démo `radtest` (PAP) — l'AP est absent |
| Routeur | Cisco ISR 1941, ACLs IOS | iptables sur srv-iris |
| Charge | 60 VMs SISR + 30 conteneurs SLAM | 1 VM démo + 1 conteneur nginx |
| Stockage | RAID 10 SSD, snapshots Veeam | Disque virtuel VirtualBox |
| Onduleur | APC Smart-UPS 1500VA | Aucun (poste utilisateur) |
| HA | Pas en production (mono-serveur) | Idem |

> Ces écarts n'invalident pas le lab : **toute la stack logicielle est
> identique** (Debian, KVM, libvirt, Docker, FreeRADIUS, iptables).

---

## 10. Évolutions possibles

- 🔐 Migration **EAP-TLS** : générer une PKI interne (`easy-rsa`), distribuer
  les certificats clients, désactiver `Cleartext-Password`.
- 📊 Ajout d'**Observability** : Prometheus + Grafana + node_exporter en
  conteneurs Docker.
- 🧪 **Pipeline CI** GitHub Actions qui exécute `vagrant up && vagrant ssh -c
  "/vagrant/provision/99-validate.sh"` à chaque commit (validation continue).
- 🌐 Ajout d'un **3e VLAN simulé** : invités (10.10.40.0/24) avec auth captive.
- 🛡 Intégration **Wazuh** ou **Suricata** sur srv-iris pour la détection
  d'intrusion.
- 🗃 Provider **libvirt** (au lieu de VirtualBox) pour les jurys sous Linux
  (performance ×2).

---

## 11. Annexes

### A — Comptes RADIUS de démonstration

| Identifiant | Mot de passe | VLAN attribué | Profil |
|---|---|---|---|
| `etudiant.sisr` | `SisrPass2026` | 20 | Étudiant SISR |
| `etudiant.slam` | `SlamPass2026` | 30 | Étudiant SLAM |
| `formateur` | `FormaPass2026` | 99 | Formateur |

Secret RADIUS partagé : `testing123`

### B — Ports réseau utilisés

| Port | Protocole | Service | Interface |
|---|---|---|---|
| 22 | TCP | SSH (Vagrant) | NAT (eth0) |
| 80 | TCP | nginx démo | 10.10.10.10 (VLAN 10) |
| 1812 | UDP | RADIUS auth | toutes |
| 1813 | UDP | RADIUS accounting | toutes |

### C — Fichiers clés à connaître

```
/etc/freeradius/3.0/users          ← comptes & attributs VLAN
/etc/freeradius/3.0/clients.conf   ← NAS autorisés
/var/log/freeradius/radius.log     ← log principal
/var/log/freeradius/radacct/       ← accounting
/opt/iris-demo/docker-compose.yml  ← stack Docker démo
/etc/sysctl.conf                   ← ip_forward
```

### D — Références bibliographiques

- **Vagrant Documentation** — https://developer.hashicorp.com/vagrant/docs
- **libvirt** — https://libvirt.org/docs.html
- **FreeRADIUS Wiki** — https://wiki.freeradius.org/
- **RFC 3580** (IEEE 802.1X RADIUS Usage Guidelines) — attribution dynamique de VLAN
- **RFC 2865 / 2866** — RADIUS Authentication / Accounting
- **CNIL — Sécurité des SI dans les établissements d'enseignement** —
  https://www.cnil.fr/fr/securite-mesures-elementaires
- **Référentiel BTS SIO 2026** — Annexe I (compétences) + Annexe VI (épreuves)

---

**Document version :** 1.0
**Auteur :** Saïd AHMED MOUSSA · BTS SIO SISR · IRIS Mediaschool Nice · Session 2026
**Licence :** CC-BY-SA 4.0 (réutilisable avec attribution)
