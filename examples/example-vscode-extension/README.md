<!--filepath: d:\Projects\Personal\IssueSync\examples\example-vscode-extension\README.md -->
# GitHub Task Generator

Cette extension VS Code permet de générer automatiquement des tâches à partir d'issues GitHub. Elle utilise la bibliothèque `issuesync` pour communiquer avec l'API GitHub et récupérer les issues.

## Fonctionnalités

- Connexion à GitHub via un token d'accès personnel
- Récupération des issues ouvertes d'un dépôt GitHub
- Sélection interactive d'issues dans une liste
- Création automatique de tâches VS Code basées sur les issues
- Liaison des tâches avec les issues GitHub correspondantes

## Configuration de l'extension

1. Installez l'extension
2. Ouvrez les paramètres VS Code (Ctrl+,)
3. Recherchez "GitHub Task Generator"
4. Configurez les options suivantes :
   - `githubTaskGenerator.token` : Votre token d'accès personnel GitHub
   - `githubTaskGenerator.defaultOwner` : Propriétaire par défaut du dépôt (facultatif)
   - `githubTaskGenerator.defaultRepo` : Nom par défaut du dépôt (facultatif)

## Utilisation

1. Ouvrez un espace de travail VS Code
2. Exécutez la commande `Générer des tâches à partir d'issues GitHub` depuis la palette de commandes (Ctrl+Shift+P)
3. Entrez le propriétaire et le nom du dépôt (si non définis par défaut)
4. Sélectionnez une issue dans la liste qui apparaît
5. Choisissez le type de tâche (shell, npm)
6. Entrez la commande à exécuter
7. Une tâche sera créée dans le fichier `.vscode/tasks.json` de votre espace de travail

## Comment ça marche

L'extension utilise la bibliothèque `issuesync` pour communiquer avec l'API GitHub. Les étapes principales sont :

1. Initialisation avec le token GitHub
2. Récupération des issues ouvertes du dépôt spécifié
3. Affichage des issues dans une liste interactive
4. Création d'une tâche VS Code basée sur l'issue sélectionnée
5. Ajout de la tâche au fichier `.vscode/tasks.json`

## Développement

### Structure du projet

```
example-vscode-extension/
  ├── package.json      # Configuration de l'extension
  ├── extension.js      # Code principal de l'extension
  └── README.md         # Documentation
```

### Déboguer l'extension

1. Ouvrir le dossier dans VS Code
2. Appuyer sur F5 pour lancer une nouvelle fenêtre VS Code avec l'extension
3. Exécuter la commande `Générer des tâches à partir d'issues GitHub`

### Utilisation d'IssueSync

Cette extension montre comment intégrer la bibliothèque `issuesync` dans une extension VS Code :

```javascript
// Importer la bibliothèque
const issueSync = require('issuesync');

// Initialiser avec le token GitHub
issueSync.init({ token: 'votre-token-github' });

// Récupérer les issues
const issues = await issueSync.listIssues({ 
  owner: 'propriétaire-du-dépôt', 
  repo: 'nom-du-dépôt',
  state: 'open' 
});

// Utiliser les issues récupérées
console.log(`${issues.length} issues récupérées`);
```

## Licence

Cette extension est distribuée sous la licence MIT. Voir le fichier LICENSE pour plus d'informations.
