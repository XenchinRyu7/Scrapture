# Migration Guide: Simple to Advanced Crawler

## Overview

Scrapture now has TWO crawler modes:

1. **Simple Multi-Page Crawler** (existing) - Quick crawls with manual URL list
2. **Advanced Full-Site Crawler** (new) - Intelligent site exploration with frontier queue

## Key Differences

| Feature | Simple Crawler | Advanced Crawler |
|---------|----------------|------------------|
| Entry Point | `/` (Dashboard) | `/sessions` |
| Scope | Specific URL + follow links | Full website from seed |
| Discovery | Manual link following | Sitemap + robots.txt + links |
| Database | `CrawlJob` only | `CrawlSession` + `DiscoveredUrl` + `CrawlJob` |
| Worker | `worker.ts` | `worker-session.ts` |
| Use Case | Quick scrapes | Site mapping, SEO audit |

## When to Use Which?

### Use Simple Crawler When:
- ✅ You know the exact URLs to scrape
- ✅ You want a quick one-off crawl
- ✅ The site has < 50 pages
- ✅ You don't need sitemap parsing

### Use Advanced Crawler When:
- ✅ You want to discover ALL pages on a site
- ✅ You need robots.txt compliance
- ✅ The site has 100+ pages
- ✅ You want depth-based exploration
- ✅ You need URL deduplication
- ✅ You want to respect politeness rules

## Migration Steps

### 1. Run Database Migration

The schema has been updated with new tables. Run:

```bash
npm run db:push
```

This adds:
- `CrawlSession` table
- `DiscoveredUrl` table
- New fields in `CrawlJob` and `DomainConfig`

### 2. Start Session Worker

For advanced crawling, you need the session worker:

```bash
# Terminal 1 - Redis (if not already running)
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2 - Next.js App
npm run dev

# Terminal 3 - Simple Crawler Worker (existing jobs)
npm run worker

# Terminal 4 - Advanced Crawler Worker (NEW - for sessions)
npm run worker:session
```

### 3. Update Your Workflow

#### Before (Simple Crawler)
```
1. Go to Dashboard (/)
2. Enter URL
3. Set max pages (1-50)
4. Click "Start Crawl"
```

#### After (Advanced Crawler)
```
1. Go to Sessions (/sessions)
2. Click "New Session"
3. Configure:
   - Seed URL
   - Max Depth (e.g., 3)
   - Max Pages (e.g., 100)
4. Click "Start Advanced Crawl"
5. Monitor in session detail page
```

## Backwards Compatibility

✅ **Fully backwards compatible!**

- Existing `CrawlJob` records still work
- Simple crawler still available on Dashboard
- All existing API endpoints unchanged
- Old worker (`worker.ts`) still functions

## New Environment Variables

No new environment variables required! Advanced crawler uses existing:

- `DATABASE_URL` - SQLite database
- `REDIS_URL` - Redis connection

## Configuration

### Simple Crawler Config (Unchanged)
```typescript
{
  url: "https://example.com",
  maxPages: 10,
  followLinks: true,
  sameDomainOnly: true
}
```

### Advanced Crawler Config (New)
```typescript
{
  seedUrl: "https://example.com",
  maxDepth: 3,
  maxPages: 100,
  sameDomainOnly: true,
  followSitemap: true,
  respectRobots: true
}
```

## API Changes

### New Endpoints

```
POST /api/sessions
GET  /api/sessions
GET  /api/sessions/:id
DELETE /api/sessions/:id
```

### Existing Endpoints (Unchanged)

```
POST /api/jobs
GET  /api/jobs
GET  /api/jobs/:id
DELETE /api/jobs/:id
POST /api/jobs/bulk-delete
GET  /api/stats
GET  /api/configs
POST /api/configs
GET  /api/configs/:id
PUT  /api/configs/:id
DELETE /api/configs/:id
```

## UI Changes

### New Pages

- `/sessions` - List crawl sessions
- `/sessions/[id]` - Session detail with charts

### Updated Sidebar

New "Sessions" link added:
- 📊 Dashboard
- **🕷️ Sessions** (NEW)
- 📋 Jobs
- 📄 Results
- ⚙️ Configs
- 📝 Logs

## Performance Considerations

### Simple Crawler
- Memory: Low (processes sequentially)
- Speed: Fast for small sites
- Best for: < 50 pages

### Advanced Crawler
- Memory: Medium (maintains frontier queue)
- Speed: Optimized for large sites
- Best for: 100+ pages

## Troubleshooting

### "Session worker not processing"

Make sure session worker is running:
```bash
npm run worker:session
```

### "Too many discovered URLs"

Reduce `maxDepth` or `maxPages`:
```typescript
{
  maxDepth: 2,  // Instead of 3
  maxPages: 50  // Instead of 100
}
```

### "Jobs from sessions not showing"

Sessions create jobs automatically. Check:
1. Session status is "running"
2. Session worker is running
3. Redis is connected

## Example Migration

### Before: Crawl a blog

```typescript
// Dashboard (/)
{
  url: "https://blog.example.com",
  maxPages: 20,
  followLinks: true
}
```

### After: Use advanced crawler

```typescript
// Sessions (/sessions)
{
  seedUrl: "https://blog.example.com",
  maxDepth: 3,      // Home → Category → Post
  maxPages: 100,
  followSitemap: true  // Auto-discover from sitemap.xml
}
```

**Benefits:**
- Discovers all pages via sitemap
- Respects robots.txt
- Deduplicates URLs
- Tracks depth and parent URLs
- Better for SEO audits

## Rollback Plan

If you need to rollback:

1. Stop session worker
2. Continue using simple crawler (Dashboard)
3. Old data is preserved

No data loss - both systems coexist!

## Support

- Simple Crawler: Use Dashboard (`/`)
- Advanced Crawler: Use Sessions (`/sessions`)
- Both: Use `/jobs` to see all crawled pages
- Docs: See `ADVANCED_CRAWLER.md`

---

**🎉 Enjoy the new advanced crawler!**
