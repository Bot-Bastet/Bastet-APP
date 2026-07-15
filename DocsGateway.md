# CORE-Gateway

Passerelle locale entre le **robot Bastet**, l'**application mobile** et le **CORE-Node** (serveur de calcul).

```text
[ Robot ]  <─── WebSockets (Texte, Audio, Contrôle) ───>  [ Gateway Hub ]  <─── WebSockets ───>  [ CORE-Node ]
[ Robot ]  ─── RTSP (Vidéo) ───────────────────────────>  [ MediaMTX ]     ─── WebRTC/HLS ───>  [ App Mobile ]
[ App Mobile ] <── REST (Comptes, Intranet, Visages) ──>  [ Gateway API ]
```

## Services & Ports à ouvrir

Pour un accès externe via IP publique, les ports suivants doivent être redirigés vers votre machine :

| Service | Port externe | Protocole | Description |
|---|---|---|---|
| **API Gateway** | `44888` | HTTPS (Standard, pas de mTLS) | API (Auth, MyGES, Visages, État CORE) |
| **RTSP Proxy** | `48554` | TCP/UDP | Flux directs pour le robot et l'IA |
| **HLS Stream** | `48888` | TCP | Flux vidéo de secours |
| **WebRTC Signal** | `48889` | TCP | Interface web / Signalisation WebRTC |
| **WebRTC ICE** | `48189` | TCP/UDP | **CRITIQUE : Transfert vidéo Ultra-Basse Latence** |

---

## Démarrage rapide

### Installation
```bash
git clone https://github.com/Bot-Bastet/CORE-Gateway.git
cd CORE-Gateway

# 1. Configurer les variables
cp .env.example .env
# Éditer .env : configurer les sources CAM et votre API_TOKEN
```

### Lancement (Docker Compose)
```bash
# Lancer les services (API en HTTP + Proxy Vidéo)
docker compose up -d --build

# Vérifier le fonctionnement
docker compose ps
```

---

## API & Sécurité
L'API est accessible en **HTTPS** (port `44888`) via `https://ha.arthonetwork.fr:44888`.
Chaque requête doit inclure le Header : `X-API-Token: votre-token`.
WebSocket : `wss://ha.arthonetwork.fr:44888/ws/app?token=votre_token`

### Variables d'environnement (App Mobile)
| Variable | Défaut | Description |
|---|---|---|
| `EXPO_PUBLIC_GATEWAY_IP` | `ha.arthonetwork.fr` | Hôte Gateway |
| `EXPO_PUBLIC_GATEWAY_PORT` | `44888` | Port API REST/WS |
| `EXPO_PUBLIC_USE_SSL` | `true` | HTTPS/WSS |
| `EXPO_PUBLIC_DEV_TOKEN` | — | Token API (dev/CI) |

---

## Flux vidéo (MediaMTX)

| Format | URL |
|---|---|
| RTSP | `rtsp://IP_GATEWAY:48554/robot/cam1` |
| HLS  | `https://IP_GATEWAY:48888/robot/cam1/` |
| WebRTC (WHEP) | `https://IP_GATEWAY:48889/robot/cam1/whep` |

---

## 🌐 ROADMAP

- [x] **Hub WebSockets** : Routage temps-réel entre Robot, Node et App.
- [x] **Authentification** : Endpoints `/auth/login` et `/auth/register` (BCrypt).
- [x] **Accès Public** : Passage en HTTP pour éviter les erreurs SSL sur IP.
- [x] **Intégration MyGES** : Synchronisation du planning scolaire.
- [ ] **Interface d'Admin** : Dashboard web pour gérer les utilisateurs et les visages.

# Documentation API : CORE-Gateway

La passerelle (Gateway) sert de pont central entre le **Robot Bastet (CORE)**, le **CORE-Node (Traitement lourd)**, et l'**Application Mobile**. Elle assure le routage instantané (WebSockets), la sécurité et la gestion des comptes.

---

## 0. Accès & Sécurité

L'API est accessible en **HTTPS standard** (sans mTLS / certificat client) via le domaine `ha.arthonetwork.fr`.
Toutes les requêtes (REST et WebSockets) doivent inclure l'authentification :

- **Port** : `44888`
- **URL** : `https://ha.arthonetwork.fr:44888`
- **Auth** : HTTPS Simple + API Token (X-API-Token)
- **Header REST** : `X-API-Token: votre_token`
- **Paramètre WebSocket** : `?token=votre_token`

---

## 1. Hub WebSockets (Communication Temps-Réel)

Pour garantir une latence minimale (< 50ms), les flux principaux utilisent des WebSockets.

### `wss://ha.arthonetwork.fr:44888/ws/robot` (Connexion Robot)
Canal bidirectionnel exclusif pour le robot.

### `wss://ha.arthonetwork.fr:44888/ws/node` (Connexion CORE-Node)
Canal bidirectionnel exclusif pour le serveur de calcul.

### `wss://ha.arthonetwork.fr:44888/ws/app` (Connexion Application Mobile)
Canal pour l'utilisateur (État du robot, télécommande).

#### Messages WebSocket App → Gateway → Robot
- **`request_camera`** : `{ "type": "request_camera", "camera": 1, "v_slam": false }`
- **`release_camera`** : `{ "type": "release_camera", "camera": 1 }`
- **`stop_camera`** : `{ "type": "stop_camera", "camera": 1 }`
- **`cmd_vel`** : `{ "type": "cmd_vel", "linear": 0.2, "angular": -0.5 }`
- **`nav_goal`** : `{ "type": "nav_goal", "x": 1.25, "y": -0.8 }`
- **`arduino_cmd`** : `{ "type": "arduino_cmd", "cmd": "stand" }` (stand, sit, attach, detach, write, reset_imu)
- **`manual_joint_control`** : `{ "type": "manual_joint_control", "angles": [90.0, ...] }` (12 angles)
- **`chat`** : `{ "type": "chat", "text": "Bonjour Bastet" }`
- **`run_mono_calib`** / **`run_stereo_calib`** : Lancement calibration caméra
- **`telemetry_diagnostics`** (entrant) : joints, imu, topics, pose, path, ai_state
- **`stream_status`** (entrant) : `{ "type": "stream_status", "camera": 1, "active": true }`
- **`mono_calib_*`** / **`stereo_calib_*`** (entrant) : frames, progress, result

#### Messages WiFi (legacy, conservés par l'App)
- **`scan_wifi`**, **`wifi_list`**, **`wifi_list_error`**, **`connect_wifi`**, **`forget_wifi`**

---

## 2. Authentification & Comptes (REST)

L'API utilise des endpoints dédiés pour l'authentification, tout en conservant la gestion des profils.

### **POST `/auth/register`** (ou `/accounts`)
Crée ou met à jour un compte utilisateur.
```json
{
  "email": "utilisateur@bastet.com",
  "pseudo": "Pseudo",
  "first_name": "Prénom",
  "last_name": "Nom",
  "phone": "0600000000",
  "password": "votre_mot_de_passe",
  "is_admin": false,
  "preferences": {}
}
```

### **POST `/auth/login`**
Vérifie les identifiants et retourne les informations de l'utilisateur.
```json
{
  "email": "utilisateur@bastet.com",
  "password": "votre_mot_de_passe"
}
```

### **GET `/accounts`**
Liste tous les comptes enregistrés (nécessite d'être Admin).

### **DELETE `/accounts/{full_name}`**
Supprime un compte (MyGES et visages inclus).

### **POST `/preferences`**
Enregistre les préférences utilisateur.

---

## 3. Identifiants Intranet / MyGES (REST)

Le robot accède aux données MyGES via ces endpoints.

- **POST `/myges`** : Enregistre les identifiants MyGES (username/password) pour un utilisateur.
- **GET `/myges`** : Récupère les identifiants MyGES (interrogé par le robot).
- **POST `/myges/test`** : Teste la validité des identifiants et retourne un aperçu du planning.

---

## 4. Base de Visages (REST)

L'App permet à l'utilisateur de s'enregistrer pour être reconnu.

- **POST `/faces/upload`** : Upload de photos (Multipart). Limité à 8 photos par personne.
- **GET `/faces`** : Lister tous les visages enregistrés.
- **GET `/faces/{face_id}/image`** : Récupérer l'image correspondante.
- **DELETE `/faces/{face_id}`** : Supprimer un visage.

---

## 5. Flux Vidéos (RTSP / WebRTC)

Géré par MediaMTX (intégré à la Gateway). L'encodage vidéo H.264 utilise obligatoirement le profil standard `yuv420p` pour assurer une compatibilité totale avec les navigateurs web récents.
- **RTSP (Publication/Lecture)** : `rtsp://GATEWAY_IP:48554/robot/cam1` (Basse latence, pour le Node/IA)
- **HLS** : `https://ha.arthonetwork.fr:48888/robot/cam1/` (Streaming web via lecteur intégré Caddy)
- **WebRTC (WHEP)** : `https://ha.arthonetwork.fr:48889/robot/cam1/whep`

### 5.1 API REST des Flux Caméras (On-Demand)
- **GET `/api/cameras`** : Manifest des caméras
- **GET `/api/streams`** : État de tous les flux
- **GET `/api/streams/{cam}`** : État d'un flux
- **POST `/api/streams/{cam}/join`** : Rejoindre un flux
- **DELETE `/api/streams/{cam}/leave`** : Quitter un flux
- **POST `/api/streams/{cam}/stop`** : Arrêt forcé

### 5.2 Configuration Qualité Stream
- **GET/POST `/core/stream/config`** : résolution, framerate, bitrate

### 5.3 Calibration REST
- **POST `/api/calibration/camera/run/mono`**
- **POST `/api/calibration/camera/run/stereo`**
- **POST `/api/calibration/camera/abort`**

---

## 6. État du Robot, Calibration & Téléopération (REST)

### 6.1 Diagnostic & État
- **GET/POST `/core/state`**
- **GET `/core/diagnostics`**

### 6.2 Calibration Servomoteurs & Caméras
- **GET/POST `/core/calibration`** : 12 offsets servos
- **GET/POST `/core/camera/calibration/{cam_id}`**
- **GET/POST `/core/camera/calibration/stereo`**
- **POST `/core/camera/calibration/reset`**

### 6.3 Téléopération & Contrôle Moteur (REST)
- **POST `/api/robot/navigation/goal`** : `{ "x": 1.5, "y": -0.5 }`
- **POST `/api/robot/motion/velocity`** : `{ "linear": 0.2, "angular": -0.1 }`
- **POST `/api/robot/motion/joints`** : `{ "angles": [90.0, ...] }`
- **POST `/api/robot/arduino/command`** : `{ "cmd": "stand" }`
- **POST `/api/robot/chat`** : `{ "text": "Fais un pas en avant" }`

**Payload CORE State :**
```json
{
  "seen_person": "Nom reconnu ou null",
  "seen_objects": ["liste", "objets", "detectes"],
  "last_chat": [{"role": "user", "content": "..."}],
  "robot_status": "online / hibernating / offline",
  "active_streams": {
    "1": true,
    "2": false
  },
  "robot_version": "v0.2.5",
  "arduino_version": "v0.0.0",
  "sensors": {
    "cpu_percent": 45,
    "ram_percent": 25.0,
    "temp_c": 65.0,
    "spotbot_service_active": true,
    "spotbot_service": "active / inactive",
    "cam1_connected": true,
    "cam2_connected": false,
    "arduino_connected": true,
    "system": {
      "cpu_temp": 65.0,
      "cpu_load_1m": 1.8,
      "ram_total_mb": 8062,
      "ram_used_mb": 2048,
      "ram_percent": 25.0
    }
  },
  "ai_state": {
    "tts": "robot / node / disabled",
    "stt": "robot / node / disabled",
    "chat": "robot / node / disabled",
    "yolo": "enabled / disabled",
    "face_rec": "enabled / disabled"
  }
}
```

---

## 7. Mises à Jour & Télémétrie (REST + WebSockets)

Permet de contrôler et surveiller les mises à jour de la Gateway, du Robot et de l'Arduino. Un mécanisme de sécurité réinitialise le statut à `failed` en cas d'absence de progression pendant plus de 10 minutes (anti-blocage).

### **POST `/system/update/gateway`**
Lance la mise à jour sur la Gateway (redémarre le conteneur).

### **GET `/system/update/gateway/progress`**
Récupère le statut de progression de la Gateway.
- **Query Parameter (facultatif)** : `?force=true` (force le contournement du cache local et interroge l'API GitHub directement pour actualiser la version).
```json
{
  "status": "idle / downloading / extracting / done / failed",
  "percent": 100
}
```

### **POST `/system/update/gateway/progress`**
Permet de mettre à jour la progression de la mise à jour de la Gateway.

### **POST `/system/update/robot`**
Déclenche la mise à jour du robot via WebSocket.

### **GET `/system/update/robot/progress`**
Récupère la progression de la mise à jour du robot (compilation `colcon build`).
- **Query Parameter (facultatif)** : `?force=true` (force le contournement du cache local et interroge l'API GitHub directement).

### **POST `/system/update/robot/progress`**
Permet au robot de notifier son état et sa progression de mise à jour.

### **POST `/system/update/arduino`**
Déclenche le flashage du code sur l'Arduino Mega (uniquement si le robot est en ligne et l'Arduino connecté).

### **GET `/system/update/arduino/progress`**
Récupère le statut et la progression du flashage Arduino.
- **Query Parameter (facultatif)** : `?force=true` (force le contournement du cache local).

### **POST `/system/update/arduino/progress`**
Permet au robot de notifier l'avancement du flash de l'Arduino.

### **POST `/system/update/gateway/rollback`**
Rollback Gateway : `{ "version": "v0.3.7" }`

### **POST `/system/update/robot/rollback`**
Rollback Robot : `{ "version": "v0.2.27" }`

---

## 8. Diagnostic Santé (REST)

### **GET `/health`**
```json
{ "status": "healthy" }
```