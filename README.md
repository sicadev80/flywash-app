# FLY-WASH Native Starter

Application Expo / React Native inspirée des écrans Glide fournis.

## Ce qui est inclus
- thème noir + or proche de la direction visuelle observée
- navigation mobile par onglets
- accueil métier
- dilution flash prioritaire
- calcul surface toiture
- calcul prix mission
- agenda chantier
- profil / produits / véhicules / matériel / charges / annuaire / abonnement
- client Supabase prêt à brancher via variables d'environnement

## Ce qui reste à brancher
- authentification Supabase
- CRUD réel sur toutes les tables
- RLS et policies
- import des vraies formules Glide détaillées pour toutes les variantes de toitures
- mesure angle via capteurs
- cartes / satellite / photo drone
- PDF / devis / factures
- push notifications
- publication stores

## Installation
```bash
npm install
cp .env.example .env
npm run start
```

## Variables d'environnement
```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Où stocker le projet
- code : GitHub
- backend et base : Supabase
- builds iOS/Android : Expo EAS Build
- médias : Supabase Storage

## Mise en ligne native
1. créer le repo GitHub
2. pousser ce dossier dans le repo
3. connecter le projet à Expo
4. configurer EAS Build
5. générer APK/AAB Android et build iOS
6. publier sur Google Play Console et App Store Connect

## Remarque importante
Ce livrable est une **base de travail complète et cohérente**, mais pas une application finale prête store sans branchement backend, tests et finitions.
