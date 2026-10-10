# Bataille de Po/ets — React + Vite + Supabase (PWA)

Jeu de cartes deckbuilding absurde. Version React, installable (PWA).

## Lancer en local
```
npm install
npm run dev
```
Puis ouvrir l'URL affichee (http://localhost:5173).

## Build de production
```
npm run build
npm run preview
```

## Variables d'environnement
Dans `.env.local` (deja cree) :
- `VITE_SUPABASE_URL` : URL du projet Supabase
- `VITE_SUPABASE_ANON_KEY` : cle publishable (publique, cote navigateur)

Ne JAMAIS mettre le mot de passe Postgres ici.

## Base de donnees
Voir `supabase/schema.sql` : a coller dans l'editeur SQL de Supabase.
