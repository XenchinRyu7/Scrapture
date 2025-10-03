# Advanced Crawler Documentation

## Overview

Scrapture now includes an **Enterprise-Grade Advanced Crawler** that can perform full-site crawling with intelligent URL discovery, normalization, and deduplication.

## Key Features

### 🎯 Core Capabilities

1. **Full Site Crawling**
   - Automatic discovery of all pages on a website
   - Depth-first exploration with configurable max depth
   - Frontier queue management with BullMQ

2. **URL Normalization & Deduplication**
   - Lowercase hostnames
   - Remove tracking parameters (utm_*, fbclid, gclid, etc.)
   - Remove URL fragments (#)
   - Sort query parameters
   - Remove trailing slashes
   - Handle canonical URLs
   - SHA-256 hashing for fast lookups

3. **Sitemap Discovery & Parsing**
   - Automatic sitemap.xml discovery
   - Support for sitemap index files
   - Parse sitemap from robots.txt
   - Enqueue all URLs from sitemaps

4. **Robots.txt Compliance**
   - Parse and respect robots.txt rules
   - Honor `crawl-delay` directive
   - Check `Allow` and `Disallow` rules
   - Support for user-agent specific rules

5. **SPA & Dynamic Content Support**
   - Intercept `history.pushState` and `history.replaceState`
   - Capture dynamically loaded URLs
   - Auto-scroll for infinite scroll pages
   - XHR/API endpoint discovery

6. **Content Deduplication**
   - SHA-256 content hashing
   - Skip duplicate content pages
   - Save storage and processing time

7. **Politeness & Rate Limiting**
   - Per-domain rate limiting
   - Exponential backoff on errors
   - Respect crawl-delay from robots.txt
   - Configurable concurrency

### 📊 Database Schema

```prisma
model CrawlSession {
  id             String
  seedUrl        String
  status         String         // pending, running, completed, failed
  maxDepth       Int
  maxPages       Int
  sameDomainOnly Boolean
  followSitemap  Boolean
  discoveredUrls DiscoveredUrl[]
  jobs           CrawlJob[]
}

model DiscoveredUrl {
  id            String
  sessionId     String
  url           String
  normalizedUrl String         // Normalized version
  canonicalUrl  String?        // From <link rel="canonical">
  status        String         // queued, running, completed, failed, skipped
  depth         Int
  parentUrl     String?
  statusCode    Int?
  contentHash   String?        // SHA-256 of content
  discoveredAt  DateTime
  crawledAt     DateTime?
}
```

## Usage

### 1. Start Session Worker

```bash
# Terminal 1 - Redis
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2 - App
npm run dev

# Terminal 3 - Session Worker (for advanced crawling)
npm run worker:session
```

### 2. Start Advanced Crawl via Dashboard

1. Go to `http://localhost:3000/sessions`
2. Click "New Session"
3. Configure:
   - **Seed URL**: Starting point (e.g., https://example.com)
   - **Max Depth**: How deep to crawl (e.g., 3)
   - **Max Pages**: Maximum pages to crawl (e.g., 100)
4. Click "Start Advanced Crawl"

### 3. Monitor Progress

- **Session Detail Page**: See discovered URLs, crawl stats
- **Charts**: URLs by status, URLs by depth
- **Real-time Updates**: Auto-refresh every 3 seconds

## Configuration Options

### Session Level

| Option | Default | Description |
|--------|---------|-------------|
| `maxDepth` | 3 | Maximum crawl depth from seed |
| `maxPages` | 100 | Maximum pages to crawl |
| `sameDomainOnly` | true | Only crawl same domain |
| `followSitemap` | true | Parse and crawl sitemap URLs |
| `respectRobots` | true | Honor robots.txt rules |
| `screenshot` | true | Capture screenshots |
| `captureApiResponses` | true | Capture XHR/API calls |
| `autoScroll` | true | Auto-scroll for infinite scroll |

### Domain Config

Configure per-domain settings in the Configs page:

- **Rate Limit**: Minimum ms between requests
- **Concurrency**: Max parallel requests
- **Delay**: Wait time after each request
- **Respect Robots**: Enable/disable robots.txt
- **Crawl Delay**: Override robots.txt crawl-delay

## URL Normalization Rules

### Removed
- Fragment identifiers (#)
- Tracking parameters (utm_*, fbclid, gclid, etc.)
- Default ports (80 for HTTP, 443 for HTTPS)
- Trailing slashes (except root /)

### Normalized
- Hostname to lowercase
- Query parameters sorted alphabetically
- Protocol included (http:// or https://)

### Example

```
Input:  https://Example.com/Page?utm_source=google&id=123#section
Output: https://example.com/page?id=123
```

## Priority System

URLs are assigned priority based on heuristics:

| URL Type | Priority | Examples |
|----------|----------|----------|
| Root | 10 | `/`, `` |
| Sitemap | 9 | `/sitemap.xml` |
| Category/Index | 8 | `/category/`, `/archive/` |
| Shallow (1 segment) | 7 | `/about` |
| Product/Article | 6 | `/product/123` |
| Medium depth (2 segments) | 5 | `/blog/post-1` |
| Deep pages | 1-4 | `/a/b/c/d/e` |

## Best Practices

### 1. Start Small
```
maxDepth: 2
maxPages: 50
```

### 2. Monitor First Run
- Check discovered URLs
- Verify robots.txt compliance
- Review rate limiting

### 3. Adjust Based on Site
- **Large sites**: Lower depth, higher pages
- **Deep sites**: Higher depth, moderate pages
- **API-heavy sites**: Enable API capture

### 4. Respect Target Site
- Use reasonable delays
- Don't overwhelm servers
- Honor robots.txt
- Add user-agent identification

## Architecture

### Crawl Flow

```
1. Initialize Session
   ├─ Discover sitemaps
   ├─ Parse robots.txt
   └─ Enqueue seed URL

2. Process Frontier
   ├─ Get next URL (lowest depth first)
   ├─ Check robots.txt
   ├─ Apply rate limiting
   └─ Crawl page
       ├─ Load with Playwright
       ├─ Auto-scroll if needed
       ├─ Extract all links
       ├─ Extract canonical URL
       ├─ Capture API responses
       ├─ Hash content
       ├─ Save to database
       └─ Enqueue discovered links

3. Complete Session
   └─ Mark session as completed
```

### URL Lifecycle

```
discovered → queued → running → completed/failed/skipped
```

## Troubleshooting

### Worker Not Processing

```bash
# Check worker logs
npm run worker:session

# Check Redis connection
redis-cli ping

# Check session status
SELECT * FROM CrawlSession WHERE status = 'running';
```

### Too Many Duplicate URLs

- Increase content deduplication
- Check canonical URLs
- Review normalization rules

### Blocked by Robots.txt

- Review `respectRobots` setting
- Check robots.txt manually
- Add specific Allow rules in domain config

### Slow Crawling

- Reduce rate limit delay
- Increase concurrency
- Disable screenshots
- Skip non-essential URLs

## API Endpoints

### Sessions

```
GET  /api/sessions          - List all sessions
POST /api/sessions          - Create new session
GET  /api/sessions/:id      - Get session details
DELETE /api/sessions/:id    - Delete session
```

### Example: Create Session

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "seedUrl": "https://example.com",
    "maxDepth": 3,
    "maxPages": 100,
    "sameDomainOnly": true,
    "followSitemap": true
  }'
```

## Performance Metrics

### Typical Crawl Speed

- **Small site** (< 100 pages): 2-5 minutes
- **Medium site** (100-1000 pages): 10-30 minutes
- **Large site** (1000+ pages): 1-3 hours

### Factors Affecting Speed

- Site response time
- Rate limiting / crawl-delay
- Network latency
- Screenshot capture
- Content size
- Concurrency settings

## Advanced Features (Future)

- [ ] Distributed crawling across multiple workers
- [ ] GraphQL endpoint discovery
- [ ] Pagination pattern detection
- [ ] Priority frontier with ML-based URL scoring
- [ ] Real-time crawl visualization
- [ ] Incremental crawling (re-crawl only changed pages)
- [ ] Proxy rotation
- [ ] CAPTCHA handling

## Comparison: Simple vs Advanced Crawler

| Feature | Simple Multi-Page | Advanced Full-Site |
|---------|-------------------|-------------------|
| Sitemap Support | ❌ | ✅ |
| Robots.txt | ❌ | ✅ |
| URL Normalization | Basic | Enterprise |
| Deduplication | URL only | URL + Content |
| Depth Tracking | ❌ | ✅ |
| Priority Queue | ❌ | ✅ |
| SPA Detection | ❌ | ✅ |
| Canonical URLs | ❌ | ✅ |
| Rate Limiting | Basic | Per-domain |
| Session Management | ❌ | ✅ |

## Example Use Cases

### 1. E-commerce Site Mapping
```javascript
{
  seedUrl: "https://shop.example.com",
  maxDepth: 4,  // Category → Subcategory → Product → Reviews
  maxPages: 1000,
  followSitemap: true
}
```

### 2. Blog/News Site
```javascript
{
  seedUrl: "https://blog.example.com",
  maxDepth: 3,  // Home → Category → Article
  maxPages: 500,
  followSitemap: true
}
```

### 3. Documentation Site
```javascript
{
  seedUrl: "https://docs.example.com",
  maxDepth: 5,  // Deep nested docs
  maxPages: 200,
  followSitemap: true
}
```

---

**🕷️ Happy Advanced Crawling!**
