/**
 * Exemple d'intégration d'IssueSync dans une application web Express
 * 
 * Ce fichier montre comment IssueSync peut être utilisé dans une application web
 * pour récupérer, afficher et synchroniser des issues GitHub.
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const issueSync = require('issuesync'); // Notre bibliothèque

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Configuration session pour stocker le token GitHub
app.use(session({
  secret: 'issuesync-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Middleware pour vérifier l'authentification GitHub
const checkGithubAuth = (req, res, next) => {
  if (!req.session.githubToken) {
    return res.redirect('/login');
  }
  
  // Initialiser IssueSync avec le token de la session
  issueSync.init({ token: req.session.githubToken });
  next();
};

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    authenticated: !!req.session.githubToken,
    title: 'IssueSync Dashboard'
  });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Connexion GitHub' });
});

app.post('/login', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.render('login', { 
      title: 'Connexion GitHub',
      error: 'Token GitHub requis'
    });
  }
  
  // Stocker le token dans la session
  req.session.githubToken = token;
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Dashboard principal
app.get('/dashboard', checkGithubAuth, (req, res) => {
  res.render('dashboard', { 
    title: 'Tableau de bord IssueSync'
  });
});

// API pour récupérer les issues
app.get('/api/issues', checkGithubAuth, async (req, res) => {
  try {
    const { owner, repo, state, labels } = req.query;
    
    if (!owner || !repo) {
      return res.status(400).json({ 
        error: 'Propriétaire et nom du dépôt requis'
      });
    }
    
    const issues = await issueSync.listIssues({
      owner,
      repo,
      state: state || 'open',
      labels: labels || ''
    });
    
    res.json(issues);
  } catch (error) {
    console.error('Erreur lors de la récupération des issues:', error);
    res.status(500).json({ error: error.message });
  }
});

// API pour synchroniser les issues
app.post('/api/sync', checkGithubAuth, async (req, res) => {
  try {
    const { 
      sourceOwner, sourceRepo, 
      targetOwner, targetRepo,
      state, labels, syncComments
    } = req.body;
    
    if (!sourceOwner || !sourceRepo || !targetOwner || !targetRepo) {
      return res.status(400).json({ 
        error: 'Information source et cible requises'
      });
    }
    
    const result = await issueSync.syncIssues({
      sourceOwner,
      sourceRepo,
      targetOwner,
      targetRepo,
      state: state || 'open',
      labels: labels || '',
      syncComments: syncComments !== false
    });
    
    res.json({
      success: true,
      message: `${result.created.length} issues créées, ${result.skipped.length} ignorées`,
      result
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation des issues:', error);
    res.status(500).json({ error: error.message });
  }
});

// API pour récupérer les statistiques des issues
app.get('/api/stats', checkGithubAuth, async (req, res) => {
  try {
    const { owner, repo } = req.query;
    
    if (!owner || !repo) {
      return res.status(400).json({ 
        error: 'Propriétaire et nom du dépôt requis'
      });
    }
    
    // Récupérer les issues ouvertes et fermées
    const openIssues = await issueSync.listIssues({
      owner,
      repo,
      state: 'open'
    });
    
    const closedIssues = await issueSync.listIssues({
      owner,
      repo,
      state: 'closed'
    });
    
    // Analyser les labels
    const labelCounts = {};
    [...openIssues, ...closedIssues].forEach(issue => {
      issue.labels.forEach(label => {
        if (!labelCounts[label.name]) {
          labelCounts[label.name] = { count: 0, color: label.color };
        }
        labelCounts[label.name].count++;
      });
    });
    
    res.json({
      open: openIssues.length,
      closed: closedIssues.length,
      total: openIssues.length + closedIssues.length,
      labels: labelCounts
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: error.message });
  }
});

// Gestionnaire d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Erreur',
    message: 'Une erreur est survenue',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});

/**
 * Note: Ce fichier est un exemple d'intégration et nécessiterait les vues EJS
 * correspondantes dans un dossier "views" et les fichiers statiques dans un 
 * dossier "public" pour fonctionner correctement.
 */
