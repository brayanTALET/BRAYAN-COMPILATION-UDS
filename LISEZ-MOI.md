# Reconnaissance d'un langage régulier (React + Vite)

## Lancer le projet
1. Extrais le zip, puis ouvre dans VS Code **le dossier qui contient `package.json`**.
2. Dans le terminal de VS Code :
   ```
   npm install
   npm run dev
   ```
3. Ouvre l'adresse affichée (généralement http://localhost:5173).

## Si PowerShell bloque npm
Erreur « l'exécution de scripts est désactivée » : tape une seule fois
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, ou utilise `npm.cmd install` et `npm.cmd run dev`.

## Syntaxe des expressions
Union `|` · étoile `*` · groupes `( )` · mot vide `ε` · concaténation par juxtaposition · espaces ignorés.
Symboles : lettres, chiffres, `_ . + -`.

## Organisation de src/
- `automata/parser.js` : analyse et validation (arbre syntaxique)
- `automata/thompson.js` : expression -> AFN
- `automata/subset.js` : AFN -> AFD
- `automata/minimise.js` : AFD -> AFD minimal (Moore)
- `automata/recognize.js` : lecture d'un mot dans l'AFD
- `automata/explain.js` : messages d'explication du verdict
- `components/Automaton.jsx` : dessin SVG d'un automate
- `App.jsx` : interface (étapes 1 à 6)
