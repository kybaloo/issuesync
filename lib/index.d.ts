/**
 * Interface pour une étiquette d'issue GitHub
 */
interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

/**
 * Interface pour une issue GitHub
 */
interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: string;
  labels: GitHubLabel[];
  comments: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  };
}

/**
 * Options pour initialiser IssueSync
 */
interface InitOptions {
  /** Token d'authentification GitHub */
  token?: string;
}

/**
 * Options pour lister les issues
 */
interface ListIssuesOptions {
  /** Propriétaire du dépôt */
  owner: string;
  /** Nom du dépôt */
  repo: string;
  /** État des issues (ouvert, fermé, tous) */
  state?: 'open' | 'closed' | 'all';
  /** Étiquettes pour filtrer les issues (séparées par des virgules) */
  labels?: string;
  /** Afficher des informations détaillées */
  verbose?: boolean;
}

/**
 * Options pour synchroniser les issues
 */
interface SyncIssuesOptions {
  /** Propriétaire du dépôt source */
  sourceOwner: string;
  /** Nom du dépôt source */
  sourceRepo: string;
  /** Propriétaire du dépôt cible */
  targetOwner: string;
  /** Nom du dépôt cible */
  targetRepo: string;
  /** État des issues à synchroniser */
  state?: 'open' | 'closed' | 'all';
  /** Étiquettes pour filtrer les issues (séparées par des virgules) */
  labels?: string;
  /** Synchroniser les commentaires des issues */
  syncComments?: boolean;
}

/**
 * Résultat de la synchronisation des issues
 */
interface SyncResult {
  /** Issues créées dans le dépôt cible */
  created: GitHubIssue[];
  /** Issues ignorées (car déjà présentes) */
  skipped: GitHubIssue[];
  /** Nombre total d'issues dans le dépôt source */
  total: number;
}

/**
 * Initialiser la bibliothèque IssueSync avec les informations d'identification GitHub
 * @param options - Options de configuration
 */
export function init(options?: InitOptions): void;

/**
 * Lister les issues d'un dépôt GitHub avec des filtres optionnels
 * @param options - Options pour lister les issues
 * @returns Une promesse résolvant en un tableau d'issues
 */
export function listIssues(options: ListIssuesOptions): Promise<GitHubIssue[]>;

/**
 * Synchroniser les issues d'un dépôt source vers un dépôt cible
 * @param options - Options de synchronisation
 * @returns Une promesse résolvant en un objet contenant les résultats
 */
export function syncIssues(options: SyncIssuesOptions): Promise<SyncResult>;
