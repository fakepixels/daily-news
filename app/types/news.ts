export interface ExaArticle {
  title?: string;
  url: string;
  text?: string;
  extract?: string;
  published_date?: string;
}

export interface ExaSearchResponse {
  results: ExaArticle[];
  next_page?: string;
  total?: number;
}

export interface ArticleWithSummary {
  title: string;
  url: string;
  summary: string;
  publishedDate: string;
}

export interface NewsSourceResult {
  source: string;
  articles: ArticleWithSummary[];
  error?: string;
}
