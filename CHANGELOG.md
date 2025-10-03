# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- MIT License
- Contributing guidelines (CONTRIBUTING.md)
- Code of Conduct (CODE_OF_CONDUCT.md)
- Security Policy (SECURITY.md)
- GitHub issue templates (bug report, feature request, question)
- Pull request template
- Project metadata in package.json

### Fixed
- All TypeScript warnings related to `any` types
- Unused variables in catch blocks

## [2.0.0-beta] - 2025-01-03 - MAJOR UPDATE: Enterprise Crawler

### 🚀 Major New Feature: Advanced Full-Site Crawler

Complete rewrite of crawler system to support enterprise-grade full-site crawling with intelligent URL discovery and politeness.

#### Core Features
- **Sitemap Discovery & Parsing**: Automatically finds and parses sitemap.xml and sitemap index files
- **Robots.txt Compliance**: Respects robots.txt rules, crawl-delay, and user-agent directives
- **URL Normalization**: Enterprise-grade URL normalization (lowercase, remove tracking params, canonical handling)
- **Content Deduplication**: SHA-256 hashing to skip duplicate content pages
- **SPA Detection**: Intercepts history.pushState/replaceState for dynamic content
- **Depth Tracking**: BFS with configurable max depth
- **Priority Frontier**: Intelligent URL prioritization (index pages first)
- **Rate Limiting**: Per-domain politeness with exponential backoff
- **Session Management**: Track full crawl sessions with statistics

#### New Database Models
- `CrawlSession`: Manage full-site crawl sessions
- `DiscoveredUrl`: Track all discovered URLs with status, depth, and metadata
- Enhanced `CrawlJob`: Now linked to sessions with depth tracking
- Enhanced `DomainConfig`: Added robots.txt caching and crawl-delay settings

#### New Utilities
- `url-normalizer.ts`: URL normalization, validation, priority calculation
- `sitemap-parser.ts`: Sitemap.xml discovery and parsing
- `robots-parser.ts`: Robots.txt parsing with rule matching
- `advanced-crawler.ts`: Full crawler implementation with frontier queue
- `session-queue.ts`: BullMQ integration for session management

#### New UI Pages
- `/sessions`: List and manage crawl sessions
- `/sessions/[id]`: Detailed session view with charts and statistics
- Charts: URLs by status, URLs by depth
- Real-time monitoring of crawl progress

#### New API Endpoints
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create new crawl session
- `GET /api/sessions/[id]` - Get session details with stats
- `DELETE /api/sessions/[id]` - Delete session

#### New Scripts
- `npm run worker:session` - Start advanced crawler worker
- New worker file: `worker-session.ts`

See [ADVANCED_CRAWLER.md](./ADVANCED_CRAWLER.md) for complete documentation.

## [1.1.0] - 2025-01-03

### Added
- **Multi-page Crawling**: Crawler now supports following links and crawling multiple pages (like Apify)
  - Configure max pages (1-50) from dashboard
  - Auto-follow links on same domain
  - Deduplication of visited URLs
  - Summary of all crawled pages in results

- **Delete System**: Complete delete functionality with confirmation dialogs
  - Delete individual jobs from list and detail page
  - Delete domain configs
  - Bulk delete jobs by status (all pending, all failed, etc.)
  - Beautiful confirmation dialogs with neumorphism design
  - Cascade deletion of results, logs, and screenshots
  
### Fixed
- Error in `/logs` page: "Cannot read properties of undefined (reading 'map')"
  - Added `includeLogs` query parameter to API
  - Added null safety check for logs array
  
- Empty results in `/results` page
  - Added `includeResults` query parameter to API
  - Properly fetch and display results with relations
  
### Changed
- Dashboard now has slider to control max pages (1-50)
- Single page vs multi-page crawl is automatically determined
- Results page now displays multi-page crawl data in organized format
- API routes now support conditional includes for performance
- Jobs list now shows delete button on hover
- Config cards have delete button with better styling

### Technical Details
- New `crawlMultiPage()` method in Crawler class
- Extended `CrawlConfig` interface with multi-page options
- Improved result display with page-by-page breakdown
- Better error handling in multi-page crawling
- New `ConfirmDialog` component for consistent delete confirmations
- New `/api/jobs/bulk-delete` endpoint for batch operations
- Prisma cascade delete configured for cleanup
