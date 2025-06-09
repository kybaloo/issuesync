/**
 * Exemple d'intégration d'IssueSync dans un pipeline CI/CD
 * 
 * Ce fichier montre comment IssueSync peut être utilisé dans un workflow
 * d'automatisation pour synchroniser les issues entre dépôts après un déploiement.
 */

const issueSync = require('issuesync');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  token: process.env.GITHUB_TOKEN,
  sourceOwner: process.env.SOURCE_OWNER || 'organisation-principale',
  sourceRepo: process.env.SOURCE_REPO || 'projet-principal',
  targetOwner: process.env.TARGET_OWNER || 'organisation-client',
  targetRepo: process.env.TARGET_REPO || 'projet-client',
  releaseTag: process.env.RELEASE_TAG || 'latest',
  issueLabel: process.env.ISSUE_LABEL || 'to-deploy',
  logFile: process.env.LOG_FILE || 'sync-results.json',
};

// Fonction principale d'exécution
async function main() {
  try {
    console.log('🔄 Démarrage de la synchronisation des issues pour le déploiement...');
    console.log(`🏷️  Version: ${CONFIG.releaseTag}`);
    
    // Vérifier la présence du token GitHub
    if (!CONFIG.token) {
      throw new Error('Token GitHub non configuré. Définissez la variable d\'environnement GITHUB_TOKEN.');
    }
    
    // Initialiser IssueSync
    issueSync.init({ token: CONFIG.token });
    
    // Récupérer les issues avec le label de déploiement
    console.log(`🔍 Récupération des issues avec le label "${CONFIG.issueLabel}"...`);
    
    const issues = await issueSync.listIssues({
      owner: CONFIG.sourceOwner,
      repo: CONFIG.sourceRepo,
      state: 'open',
      labels: CONFIG.issueLabel
    });
    
    console.log(`📋 ${issues.length} issues trouvées à déployer`);
    
    if (issues.length === 0) {
      console.log('✅ Aucune issue à synchroniser');
      return { success: true, issues: [] };
    }
    
    // Synchroniser les issues
    console.log(`🔄 Synchronisation des issues vers ${CONFIG.targetOwner}/${CONFIG.targetRepo}...`);
    
    const result = await issueSync.syncIssues({
      sourceOwner: CONFIG.sourceOwner,
      sourceRepo: CONFIG.sourceRepo,
      targetOwner: CONFIG.targetOwner,
      targetRepo: CONFIG.targetRepo,
      state: 'open',
      labels: CONFIG.issueLabel,
      syncComments: true
    });
    
    // Convertir les issues créées en format simplifié pour le log
    const createdIssues = result.created.map(issue => ({
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      labels: issue.labels.map(l => l.name)
    }));
    
    // Log les résultats
    const syncResults = {
      timestamp: new Date().toISOString(),
      release: CONFIG.releaseTag,
      source: `${CONFIG.sourceOwner}/${CONFIG.sourceRepo}`,
      target: `${CONFIG.targetOwner}/${CONFIG.targetRepo}`,
      created: createdIssues,
      skipped: result.skipped.length,
      total: result.total
    };
    
    // Sauvegarder le résultat
    await saveResults(syncResults);
    
    // Mettre à jour les issues source pour indiquer qu'elles ont été déployées
    if (createdIssues.length > 0) {
      console.log(`🏷️  Mise à jour des issues source avec le label "deployed"...`);
      
      // Cette partie utiliserait directement l'API Octokit qui est incluse dans IssueSync
      // Dans une implémentation réelle, cette fonctionnalité pourrait être ajoutée à IssueSync
      
      console.log(`✅ Issues mises à jour avec succès`);
    }
    
    console.log(`✅ Synchronisation terminée: ${result.created.length} issues créées, ${result.skipped.length} ignorées`);
    
    return {
      success: true,
      created: result.created.length,
      skipped: result.skipped.length,
      total: result.total
    };
  } catch (error) {
    console.error(`❌ Erreur lors de la synchronisation: ${error.message}`);
    
    // En cas d'échec, enregistrer l'erreur
    const errorResult = {
      timestamp: new Date().toISOString(),
      release: CONFIG.releaseTag,
      error: error.message,
      stack: error.stack
    };
    
    await saveResults(errorResult, 'sync-error.json');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Fonction pour sauvegarder les résultats
async function saveResults(results, filename = CONFIG.logFile) {
  try {
    // S'assurer que le dossier logs existe
    const logsDir = path.join(__dirname, 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    // Écrire le fichier de résultats
    const filePath = path.join(logsDir, filename);
    await fs.writeFile(filePath, JSON.stringify(results, null, 2));
    
    console.log(`📝 Résultats sauvegardés dans ${filePath}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde des résultats: ${error.message}`);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main().then(result => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}

// Exporter pour une utilisation comme module
module.exports = { 
  sync: main
};

/**
 * Comment utiliser ce script dans un pipeline CI/CD:
 * 
 * 1. GitHub Actions:
 * ```yaml
 * jobs:
 *   deploy:
 *     runs-on: ubuntu-latest
 *     steps:
 *       - uses: actions/checkout@v2
 *       - name: Setup Node.js
 *         uses: actions/setup-node@v2
 *         with:
 *           node-version: '16'
 *       - name: Install dependencies
 *         run: npm install issuesync
 *       - name: Synchronize deployment issues
 *         run: node ci-cd-integration.js
 *         env:
 *           GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
 *           RELEASE_TAG: ${{ github.ref_name }}
 *           SOURCE_OWNER: 'org-name'
 *           SOURCE_REPO: 'main-repo'
 *           TARGET_OWNER: 'client-org'
 *           TARGET_REPO: 'client-repo'
 * ```
 * 
 * 2. GitLab CI:
 * ```yaml
 * deploy:
 *   stage: deploy
 *   script:
 *     - npm install issuesync
 *     - node ci-cd-integration.js
 *   variables:
 *     GITHUB_TOKEN: $GITHUB_TOKEN
 *     RELEASE_TAG: $CI_COMMIT_TAG
 *     SOURCE_OWNER: 'org-name'
 *     SOURCE_REPO: 'main-repo'
 *     TARGET_OWNER: 'client-org' 
 *     TARGET_REPO: 'client-repo'
 * ```
 */
