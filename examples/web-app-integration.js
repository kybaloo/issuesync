/**
 * Example of issuesync integration in an Express web application
 * 
 * This file shows how issuesync can be used in a web application
 * to retrieve, display and synchronize GitHub issues.
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const issuesync = require('issuesync'); // Our library

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session configuration to store GitHub token
app.use(session({
  secret: 'issuesync-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Middleware to check GitHub authentication
const checkGithubAuth = (req, res, next) => {
  if (!req.session.githubToken) {
    return res.redirect('/login');
  }
  
  // Initialize issuesync with session token
  issuesync.init({ token: req.session.githubToken });
  next();
};

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    authenticated: !!req.session.githubToken,
    title: 'issuesync Dashboard'
  });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Connexion GitHub' });
});

app.post('/login', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.render('login', { 
      title: 'GitHub Connexion',
      error: 'GitHub Token required'
    });
  }

  // Store token in the session
  req.session.githubToken = token;
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Main Dashboard
app.get('/dashboard', checkGithubAuth, (req, res) => {
  res.render('dashboard', { 
    title: 'issuesync Dashboard'
  });
});

// API to retrieve issues
app.get('/api/issues', checkGithubAuth, async (req, res) => {
  try {
    const { owner, repo, state, labels } = req.query;
    
    if (!owner || !repo) {
      return res.status(400).json({ 
        error: 'owner and name of the repository required'
      });
    }
    
    const issues = await issuesync.listissues({
      owner,
      repo,
      state: state || 'open',
      labels: labels || ''
    });
    
    res.json(issues);
  } catch (error) {
    console.error('error during retrieval of the issues:', error);
    res.status(500).json({ error: error.message });
  }
});

// API for synchronize les issues
app.post('/api/sync', checkGithubAuth, async (req, res) => {
  try {
    const { 
      sourceOwner, sourceRepo, 
      targetOwner, targetRepo,
      state, labels, syncComments
    } = req.body;
    
    if (!sourceOwner || !sourceRepo || !targetOwner || !targetRepo) {
      return res.status(400).json({ 
        error: 'Source and target information required'
      });
    }
    
    const result = await issuesync.syncissues({
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
      message: `${result.created.length} issues created, ${result.skipped.length} ignored`,
      result
    });
  } catch (error) {
    console.error('Error during synchronization of the issues:', error);
    res.status(500).json({ error: error.message });
  }
});

// API to retrieve issue statistics
app.get('/api/stats', checkGithubAuth, async (req, res) => {
  try {
    const { owner, repo } = req.query;
    
    if (!owner || !repo) {
      return res.status(400).json({ 
        error: 'owner and name of the repository required'
      });
    }
    
    // retrieve opened and closed issues
    const openissues = await issuesync.listissues({
      owner,
      repo,
      state: 'open'
    });
    
    const closedissues = await issuesync.listissues({
      owner,
      repo,
      state: 'closed'
    });

    // Analyze the labels
    const labelCounts = {};
    [...openissues, ...closedissues].forEach(issue => {
      issue.labels.forEach(label => {
        if (!labelCounts[label.name]) {
          labelCounts[label.name] = { count: 0, color: label.color };
        }
        labelCounts[label.name].count++;
      });
    });
    
    res.json({
      open: openissues.length,
      closed: closedissues.length,
      total: openissues.length + closedissues.length,
      labels: labelCounts
    });
  } catch (error) {
    console.error('Error during retrieval of the statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error',
    message: 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start of the server
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});

/**
 * Note: This file is an example of integration and would require the corresponding EJS views
 * in a "views" folder and the static files in a "public" folder to function correctly.
 */
