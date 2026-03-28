# LivrUP 🛵

> Plateforme de livraison de repas en ligne — application web fullstack développée avec Next.js 14 et Supabase.

## 🔗 Application en production

**[https://livrupcode.vercel.app](https://livrupcode.vercel.app)**

---

## 📝 Description du projet

LivrUP est une application web de livraison de repas à domicile qui connecte trois types d'utilisateurs : les **clients** qui passent des commandes, les **restaurants** qui les préparent, et les **livreurs** qui les livrent. L'application gère l'intégralité du flux de commande en temps réel, du panier jusqu'à la livraison, avec suivi GPS, chat intégré et système de notation.

---

## 🎯 Objectifs

- Créer une plateforme de livraison complète avec trois rôles distincts (client, restaurant, livreur)
- Gérer le cycle complet d'une commande en temps réel
- Permettre aux livreurs d'accepter ou refuser des commandes avec réassignation automatique
- Offrir un suivi GPS en direct du livreur pour le client
- Intégrer un système de chat entre client et livreur
- Déployer l'application en production avec un pipeline CI/CD automatisé

---

## 👥 Présentation de l'équipe

**Module :** Génie Logiciel
**Encadrant :** M. Moubarek Barré Hassan

| Nom | Rôle |
|-----|------|
| Barwako Ali | Développement & Chef de projet |
| Hawa Ali | Développement & Design |
| Aziza Abdoul-Aziz | Développement & Tests |
| Mako Badeh | Développement & Documentation |

---

## ⚙️ Technologies utilisées

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL), Row Level Security, Fonctions SQL |
| Authentification | Supabase Auth (SSR) |
| État global | Zustand (gestion du panier) |
| Cartographie | Leaflet + OpenStreetMap, react-leaflet |
| Temps réel | Supabase Realtime + polling toutes les 3s |
| Composants UI | shadcn/ui, Lucide React |
| Versioning | Git + GitHub |
| Déploiement | Vercel (CI/CD automatique) |

---

## 🚀 Fonctionnalités

### Côté Client
- Inscription et connexion avec choix du rôle
- Parcourir les restaurants et leurs menus
- Ajouter des plats au panier (gestion multi-restaurants)
- Passer une commande avec choix du livreur et du mode de paiement
- Suivi de commande en temps réel (statuts détaillés)
- Carte GPS intégrée affichant la position du livreur en direct
- Chat en temps réel avec le livreur pendant la livraison
- Notation du restaurant et du livreur après livraison
- Notifications en temps réel à chaque étape de la commande

### Côté Administrateur (Restaurant & Livreur)

**Restaurant :**
- Tableau de bord des commandes en cours avec rafraîchissement automatique
- Accepter ou refuser une commande entrante
- Gérer les étapes de préparation (confirmée → en préparation → prête)
- Gestion du menu et du profil du restaurant

**Livreur :**
- Dashboard avec statut disponible / hors ligne
- Recevoir des commandes et les accepter ou refuser
- Réassignation automatique au livreur suivant en cas de refus
- Partage de position GPS en temps réel avec le client
- Chat en temps réel avec le client
- Suivi des gains (frais de livraison) et historique des livraisons
- Système de notation et de réputation

---

## 🗂️ Structure du projet

```
app/
├── client/          # Pages du client (accueil, commandes, panier, chat, suivi GPS)
├── driver/          # Pages du livreur (dashboard, livraisons, gains, chat)
├── restaurant/      # Pages du restaurant (commandes, menu, profil)
├── auth/            # Pages de connexion et inscription
└── role-select/     # Sélection du rôle à l'arrivée

lib/
├── cart-store.ts    # Store Zustand pour le panier
├── supabase/        # Clients Supabase (client, server, middleware)
└── types.ts         # Types TypeScript

components/
└── ui/              # Composants UI réutilisables (shadcn/ui)
```

---

## 🔧 Installation locale

### Prérequis
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Étapes

```bash
# 1. Cloner le repo
git clone https://github.com/michmichbh/livrup.git
cd livrup

# 2. Installer les dépendances
pnpm install

# 3. Configurer les variables d'environnement
# Créer un fichier .env.local à la racine avec :
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon

# 4. Lancer le serveur de développement
pnpm dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

---

## 🧪 Tests réalisés

### Tests fonctionnels
Les fonctionnalités principales ont été testées manuellement end-to-end : inscription, passage de commande, acceptation par le restaurant, assignation du livreur, suivi GPS, chat, livraison et notation.

### Tests d'interface (UI)
L'application a été testée sur mobile iOS (Safari), mobile Android (Chrome), tablette et desktop (Chrome, Edge).

### Tests de cas limites
- Panier vide → redirection correcte
- Adresse manquante → message d'erreur affiché
- Tous les livreurs refusent → commande annulée, client notifié
- Champs vides dans les formulaires → validation côté client

---

## 📄 Licence

Ce projet est développé dans le cadre d'un projet scolaire — Module Génie Logiciel. Tous droits réservés © 2026.

---

## 🙏 Remerciements

- M. Moubarek Barré Hassan pour l'encadrement du projet
- [Supabase](https://supabase.com) pour la base de données et l'authentification
- [Vercel](https://vercel.com) pour l'hébergement et le déploiement
- [shadcn/ui](https://ui.shadcn.com) pour les composants d'interface
- [Leaflet](https://leafletjs.com) et [OpenStreetMap](https://www.openstreetmap.org) pour la cartographie
- [Lucide](https://lucide.dev) pour les icônes
