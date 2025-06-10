/**
 * Interface for a GitHub issue label
 */
interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

/**
 * Interface for a GitHub issue
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
 * Options to initialize IssueSync
 */
interface InitOptions {
  /** GitHub authentication token */
  token?: string;
}

/**
 * Options to list issues
 */
interface ListIssuesOptions {
  /** Repository owner */
  owner: string;
  /** Repository name */
  repo: string;
  /** Issue state (open, closed, all) */
  state?: 'open' | 'closed' | 'all';
  /** Labels to filter issues (comma-separated) */
  labels?: string;
  /** Show detailed information */
  verbose?: boolean;
}

/**
 * Options to synchronize issues
 */
interface SyncIssuesOptions {
  /** Source repository owner */
  sourceOwner: string;
  /** Source repository name */
  sourceRepo: string;
  /** Target repository owner */
  targetOwner: string;
  /** Target repository name */
  targetRepo: string;
  /** Issue state to synchronize */
  state?: 'open' | 'closed' | 'all';
  /** Labels to filter issues (comma-separated) */
  labels?: string;
  /** Synchronize issue comments */
  syncComments?: boolean;
}

/**
 * Result of issues synchronization
 */
interface SyncResult {
  /** Issues created in the target repository */
  created: GitHubIssue[];
  /** Issues ignored (already present) */
  skipped: GitHubIssue[];
  /** Total number of issues in the source repository */
  total: number;
}

/**
 * Initialize the IssueSync library with GitHub credentials
 * @param options - Configuration options
 */
export function init(options?: InitOptions): void;

/**
 * List issues from a GitHub repository with optional filters
 * @param options - Options to list issues
 * @returns A promise resolving to an array of issues
 */
export function listIssues(options: ListIssuesOptions): Promise<GitHubIssue[]>;

/**
 * Synchronize issues from a source repository to a target repository
 * @param options - Options for synchronization
 * @returns A promise resolving to an object containing the results
 */
export function syncIssues(options: SyncIssuesOptions): Promise<SyncResult>;
