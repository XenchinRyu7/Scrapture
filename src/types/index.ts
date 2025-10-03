export type JobStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface CrawlConfig {
  url: string;
  priority?: number;
  domainConfigId?: string;
  waitForSelector?: string;
  screenshot?: boolean;
  captureApiResponses?: boolean;
  autoScroll?: boolean;
  maxScrolls?: number;
  maxPages?: number;
  followLinks?: boolean;
  linkSelector?: string;
  sameDomainOnly?: boolean;
}

export interface CrawlerOptions {
  rateLimit?: number;
  delay?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  selectors?: Record<string, string>;
  enableAI?: boolean;
  aiPrompt?: string;
}

export interface CrawlData {
  htmlContent?: string;
  jsonData?: Record<string, any>;
  screenshot?: Buffer;
  apiResponses?: Array<{
    url: string;
    method: string;
    status: number;
    body: any;
  }>;
}

export interface JobStats {
  total: number;
  pending: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
}
