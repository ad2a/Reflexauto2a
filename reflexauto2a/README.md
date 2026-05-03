# Reflex'Auto 2A

Site web pour Reflex'Auto 2A — Achat, vente, dépôt-vente et location de véhicules à Porto-Vecchio, Corse du Sud.

## 🚀 Déployer sur Vercel (méthode rapide)

### Option A : Drag & Drop (la plus simple)

1. Créez un compte sur [vercel.com](https://vercel.com) (gratuit, connexion possible avec Google ou GitHub)
2. Une fois connecté, allez sur le dashboard Vercel
3. Cliquez sur **"Add New..."** → **"Project"**
4. Choisissez **"Deploy"** ou utilisez l'option d'import direct
5. **Glissez-déposez** ce dossier entier (reflexauto2a) dans la zone d'upload
6. Vercel détectera automatiquement Vite/React
7. Cliquez **"Deploy"** — votre site sera en ligne en 1-2 minutes !

URL automatique : `reflexauto2a.vercel.app` (modifiable dans les paramètres)

### Option B : Via GitHub (recommandé pour les mises à jour)

1. Créez un compte sur [github.com](https://github.com)
2. Créez un nouveau repository nommé `reflexauto2a`
3. Uploadez tous les fichiers du dossier sur GitHub (bouton "Add file" → "Upload files")
4. Sur Vercel, choisissez **"Import Git Repository"**
5. Sélectionnez votre repo GitHub `reflexauto2a`
6. Cliquez **"Deploy"**

✨ **Avantage** : à chaque modification que vous push sur GitHub, le site se met à jour automatiquement !

---

## 🌐 Nom de domaine personnalisé (optionnel — ~10€/an)

Pour avoir **reflexauto2a.fr** au lieu de `reflexauto2a.vercel.app` :

1. Achetez le domaine sur [OVH](https://www.ovhcloud.com/fr/), [Gandi](https://www.gandi.net) ou [Namecheap](https://www.namecheap.com)
2. Dans Vercel : **Settings** → **Domains** → ajoutez votre domaine
3. Suivez les instructions pour configurer les DNS (5 minutes)

---

## 📧 Activer les formulaires (recevoir les vraies demandes par email)

Actuellement les formulaires affichent un message de confirmation mais n'envoient pas vraiment d'email. Pour les activer :

### Avec Formspree (gratuit, 50 messages/mois)

1. Créez un compte sur [formspree.io](https://formspree.io)
2. Créez un formulaire connecté à `Reflexauto2a@gmail.com`
3. Récupérez l'URL du formulaire (ex: `https://formspree.io/f/xyz123`)
4. Dans le code (`src/App.jsx`), cherchez tous les `setSent(true)` et remplacez par un vrai envoi :

```javascript
// AVANT
onClick={() => setSent(true)}

// APRÈS (exemple)
onClick={async () => {
  await fetch("https://formspree.io/f/VOTRE-ID", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(form)
  });
  setSent(true);
}}
```

---

## 💻 Tester en local (optionnel)

Si vous voulez tester sur votre ordinateur avant de mettre en ligne :

```bash
npm install
npm run dev
```

Puis ouvrez http://localhost:5173

---

## 📁 Structure du projet

```
reflexauto2a/
├── public/
│   └── photos/
│       ├── logo/         ← Logo Reflex'Auto 2A
│       ├── mercedes/     ← 5 photos Mercedes Classe E
│       └── peugeot/      ← 5 photos Peugeot 2008
├── src/
│   ├── App.jsx           ← Code principal du site
│   └── main.jsx          ← Point d'entrée React
├── index.html            ← Page HTML
├── package.json          ← Dépendances
├── vite.config.js        ← Config Vite
└── README.md             ← Ce fichier
```

---

## 🆘 Besoin d'aide ?

Si vous bloquez à une étape, le plus simple est de faire appel à un développeur freelance sur :
- [Malt](https://www.malt.fr) (~150-300€)
- [Comeup](https://comeup.com)
- [5euros.com](https://5euros.com)

Donnez-leur ce dossier complet, ils déploieront en 30 minutes.

---

© 2025 Reflex'Auto 2A · Quartier Poretta, Porto-Vecchio 20137
