# GUIDE DE MISE EN ŒUVRE — Lab Vagrant Infrastructure IRIS

> **Public visé :** jury BTS SIO (E5/E6), formateurs, étudiants souhaitant
> rejouer le déploiement décrit dans la RP.
> **Durée totale :** ~15 minutes (10 min de téléchargement + 5 min de tests).
> **Niveau :** débutant Vagrant — toutes les commandes sont fournies.

---

## Sommaire

1. [Prérequis matériels et logiciels](#1-prérequis)
2. [Installation des outils](#2-installation-des-outils)
3. [Récupération du lab](#3-récupération-du-lab)
4. [Démarrage des machines](#4-démarrage-des-machines)
5. [Vérification du déploiement](#5-vérification-du-déploiement)
6. [Scénarios de démonstration](#6-scénarios-de-démonstration)
7. [Dépannage (FAQ)](#7-dépannage-faq)
8. [Arrêt / nettoyage](#8-arrêt--nettoyage)

---

## 1. Prérequis

### Matériel

| Ressource | Minimum | Recommandé |
|---|---|---|
| RAM | 6 Go libres | 8 Go libres |
| Disque | 10 Go libres | 15 Go libres |
| CPU | 2 cœurs avec **VT-x** ou **AMD-V** | 4 cœurs |
| Réseau | Connexion Internet (1re mise en route) | — |

> 🛈 **Vérifier la virtualisation matérielle**
> - **Windows** : `Get-ComputerInfo -Property "HyperVRequirementVirtualizationFirmwareEnabled"`
> - **Linux** : `egrep -c '(vmx|svm)' /proc/cpuinfo` (doit être > 0)
> - **macOS** : `sysctl kern.hv_support` (doit retourner `1`)
>
> Si désactivé : entrer dans le BIOS/UEFI → activer **Intel VT-x** / **AMD-V** / **SVM**.

### Logiciels

- **Vagrant** ≥ 2.4 — https://www.vagrantup.com/downloads
- **VirtualBox** ≥ 7.0 — https://www.virtualbox.org/wiki/Downloads
- **Git** (pour cloner) — https://git-scm.com/downloads
- Un terminal : PowerShell (Windows), Terminal (macOS), bash/zsh (Linux)

---

## 2. Installation des outils

### Windows (avec winget)

```powershell
winget install Hashicorp.Vagrant
winget install Oracle.VirtualBox
winget install Git.Git
```

### macOS (avec Homebrew)

```bash
brew install --cask vagrant virtualbox
brew install git
```

### Debian / Ubuntu

```bash
sudo apt update
sudo apt install -y virtualbox vagrant git
```

### Vérification

```bash
vagrant --version       # doit afficher Vagrant 2.4.x ou supérieur
VBoxManage --version    # doit afficher 7.x.x
```

---

## 3. Récupération du lab

```bash
git clone https://github.com/sdjbrl/prtfl.git
cd prtfl/infra-iris-vagrant
```

Structure attendue :

```
infra-iris-vagrant/
├── Vagrantfile
├── README.md
├── GUIDE.md              ← ce fichier
├── DOCUMENTATION.md
└── provision/
    ├── 01-base.sh
    ├── 02-kvm.sh
    ├── 03-docker.sh
    ├── 04-freeradius.sh
    ├── 05-network.sh
    └── 99-validate.sh
```

---

## 4. Démarrage des machines

```bash
vagrant up
```

⏱ La première exécution prend 8 à 12 minutes :
1. Téléchargement de la box `bento/debian-12` (~600 Mo)
2. Création des 2 VMs (srv-iris, poste-sisr)
3. Provisioning automatique (scripts `01` à `05` puis `99-validate.sh`)

À la fin du provisioning, le tableau de validation s'affiche :

```
═══════════════════════════════════════════════════════════
 VALIDATION INFRA IRIS — RP BTS SIO 2026
═══════════════════════════════════════════════════════════
[OK] Module kernel KVM chargé
[OK] Service libvirtd actif
[OK] virsh fonctionnel
[OK] Service docker actif
[OK] Conteneur web-iris up
[OK] Service freeradius actif
[OK] Port RADIUS 1812/udp à l'écoute
[OK] IP forwarding activé
[OK] VLAN 10 (10.10.10.10) accessible
[OK] VLAN 20 (10.10.20.1) accessible
[OK] VLAN 30 (10.10.30.1) accessible
[OK] RADIUS auth etudiant.sisr → Accept
[OK] RADIUS auth mauvais mdp → Reject
[OK] HTTP web-iris répond

 Résumé : 14 OK · 0 KO
═══════════════════════════════════════════════════════════
```

> ✅ Si tous les tests passent : le lab est opérationnel.
> ❌ Sinon : voir [§7 Dépannage](#7-dépannage-faq).

---

## 5. Vérification du déploiement

### Connexion aux VMs

```bash
vagrant ssh srv-iris        # serveur (KVM + Docker + RADIUS)
vagrant ssh poste-sisr      # poste client (test RADIUS)
```

Quitter une session SSH : `exit` ou `Ctrl+D`.

### État des VMs

```bash
vagrant status
# Current machine states:
# srv-iris       running (virtualbox)
# poste-sisr     running (virtualbox)
```

---

## 6. Scénarios de démonstration

### 🎯 Scénario A — Hyperviseur KVM

Objectif : prouver que **srv-iris** peut héberger des VMs KVM (compétence B2.2).

```bash
vagrant ssh srv-iris

# 1. Capacités de l'hyperviseur
sudo virsh capabilities | grep -E "<arch|<os_type|kvm"

# 2. Réseaux libvirt configurés
sudo virsh net-list --all

# 3. (Optionnel) Créer une mini VM Debian (10 min)
sudo virt-install --name test-vm --memory 512 --vcpus 1 \
  --disk size=4 --network network=default \
  --location http://deb.debian.org/debian/dists/bookworm/main/installer-amd64/ \
  --extra-args "console=ttyS0,115200" --noautoconsole

sudo virsh list --all
```

### 🎯 Scénario B — Authentification RADIUS dynamique (★ démo phare E6)

Objectif : montrer que FreeRADIUS authentifie chaque profil utilisateur **et**
lui attribue dynamiquement le bon VLAN (compétences B3.1, B3.2).

```bash
vagrant ssh poste-sisr

# Étudiant SISR → Accept + VLAN 20
radtest etudiant.sisr SisrPass2026 10.10.10.10 0 testing123

# Étudiant SLAM → Accept + VLAN 30
radtest etudiant.slam SlamPass2026 10.10.10.10 0 testing123

# Formateur → Accept + VLAN 99
radtest formateur    FormaPass2026 10.10.10.10 0 testing123

# Mauvais mot de passe → Reject (loggé)
radtest etudiant.sisr WRONGPASS    10.10.10.10 0 testing123
```

**Réponse attendue pour un Accept :**
```
Received Access-Accept Id 12 from 10.10.10.10:1812
        Reply-Message = "Bienvenue etudiant.sisr (SISR — VLAN 20)"
        Tunnel-Type = VLAN
        Tunnel-Medium-Type = IEEE-802
        Tunnel-Private-Group-Id = "20"
```

L'attribut `Tunnel-Private-Group-Id` est la **valeur du VLAN** poussée
au switch / point d'accès en production.

### 🎯 Scénario C — Service Docker exposé via VLAN

Objectif : montrer que le serveur peut héberger des services applicatifs
conteneurisés tout en respectant la segmentation réseau (B2.3).

```bash
# Depuis poste-sisr (VLAN 20) — la requête est routée par srv-iris
vagrant ssh poste-sisr -c "curl -s http://10.10.10.10/ | head -20"
```

### 🎯 Scénario D — Traçabilité (preuve sécurité)

```bash
vagrant ssh srv-iris

# Logs RADIUS en temps réel
sudo tail -f /var/log/freeradius/radius.log

# Détail accounting (qui s'est connecté, quand)
sudo ls /var/log/freeradius/radacct/
```

---

## 7. Dépannage (FAQ)

### ❌ `vagrant up` échoue avec "VT-x is not available"

→ Activer Intel VT-x / AMD-V dans le BIOS/UEFI, puis redémarrer.
Sous Windows, désactiver Hyper-V s'il est installé :
```powershell
bcdedit /set hypervisorlaunchtype off
# Redémarrer
```

### ❌ "Authentication failure. Retrying..."

→ Le téléchargement de la box a échoué.
```bash
vagrant box remove bento/debian-12
vagrant up
```

### ❌ Provisioning échoue sur `02-kvm.sh`

→ La virtualisation imbriquée n'est pas activée.
Le `Vagrantfile` la force déjà via :
```ruby
vb.customize ["modifyvm", :id, "--nested-hw-virt", "on"]
```
Si l'erreur persiste, ajouter `--paravirtprovider kvm` ou tester en l'absence
de virtualisation imbriquée (KVM tournera en mode TCG, plus lent mais fonctionnel).

### ❌ `radtest` retourne "no response"

```bash
vagrant ssh srv-iris
sudo systemctl restart freeradius
sudo journalctl -u freeradius -n 30
```

### ❌ `vagrant up` reste bloqué sur "Mounting shared folders"

→ Installer le plugin :
```bash
vagrant plugin install vagrant-vbguest
vagrant reload
```

### ⚙ Réexécuter uniquement le provisioning

```bash
vagrant provision srv-iris
vagrant provision srv-iris --provision-with freeradius   # un seul script
```

### 📊 Ressources insuffisantes

Réduire dans le `Vagrantfile` :
```ruby
vb.memory = 2048   # au lieu de 4096
vb.cpus   = 2      # au lieu de 4
```

---

## 8. Arrêt / nettoyage

```bash
# Mettre en veille (préserve l'état)
vagrant suspend

# Éteindre proprement
vagrant halt

# Supprimer complètement les VMs
vagrant destroy -f

# Supprimer aussi la box téléchargée (libère ~1 Go)
vagrant box remove bento/debian-12
```

---

## ✅ Checklist jury (à valider en démo)

- [ ] `vagrant up` se termine sans erreur
- [ ] `99-validate.sh` affiche **14 OK · 0 KO**
- [ ] `radtest etudiant.sisr` retourne `Access-Accept` + `Tunnel-Private-Group-Id = "20"`
- [ ] `radtest` avec mauvais mot de passe retourne `Access-Reject`
- [ ] `curl http://10.10.10.10/` depuis poste-sisr retourne la page nginx
- [ ] `sudo virsh list --all` fonctionne sur srv-iris
- [ ] Logs RADIUS visibles dans `/var/log/freeradius/`

---

**Auteur :** Saïd AHMED MOUSSA · BTS SIO SISR · IRIS Mediaschool Nice · Session 2026
**Version du guide :** 1.0
