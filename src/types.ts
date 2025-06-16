export interface GitHubRepoData {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  license: {
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
  homepage: string | null;
  topics: string[];
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export interface GitHubReadmeData {
  content: string;
  encoding: string;
}