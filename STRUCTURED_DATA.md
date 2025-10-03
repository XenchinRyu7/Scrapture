# Structured Data Extraction Guide

## Overview

Scrapture now extracts **structured data** from web pages, not just screenshots! The crawler intelligently parses HTML, extracts JSON-LD schema.org data, captures API responses, and can even use AI (Ollama) for content analysis.

## What Gets Extracted

### 1. HTML Parsing (Cheerio)

Every crawled page is parsed to extract:

```typescript
{
  title: string;              // <title> or og:title
  metaDescription: string;    // meta[name="description"]
  metaKeywords: string;       // meta[name="keywords"]
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  links: Array<{              // All <a href>
    href: string;
    text: string;
    rel?: string;
  }>;
  images: Array<{             // All <img src>
    src: string;
    alt: string;
  }>;
  bodyText: string;           // Clean body text (max 10k chars)
  wordCount: number;
}
```

### 2. Metadata Extraction

```typescript
{
  canonical: string;          // <link rel="canonical">
  ogType: string;             // og:type (article, product, etc.)
  ogImage: string;            // og:image
  ogUrl: string;              // og:url
  author: string;             // meta[name="author"]
  publishDate: string;        // article:published_time
  modifiedDate: string;       // article:modified_time
  language: string;           // <html lang>
  robots: string;             // meta[name="robots"]
}
```

### 3. JSON-LD Structured Data

Automatically extracts all `<script type="application/ld+json">` blocks:

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Example Product",
    "price": "99.99",
    "availability": "InStock"
  },
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "...",
    "author": "...",
    "datePublished": "..."
  }
]
```

### 4. API Response Capture

All XHR/Fetch requests are intercepted and stored:

```json
{
  "https://api.example.com/products": {
    "status": 200,
    "contentType": "application/json",
    "body": { ... }
  }
}
```

### 5. Content Hash

Every page content is SHA-256 hashed for deduplication:

```
contentHash: "a3f5e9b2c1d4..."
```

## Database Schema

```prisma
model CrawlResult {
  id              String   @id @default(uuid())
  jobId           String
  url             String
  
  // Original fields
  htmlContent     String?   // Full HTML
  screenshotPath  String?   // Screenshot
  
  // NEW: Structured data fields
  structuredData  String?   // JSON: JSON-LD + custom extracts
  metadata        String?   // JSON: metadata object
  contentHash     String?   // SHA-256 of content
  extractedText   String?   // Clean body text
  apiResponses    String?   // JSON: captured API calls
  jsonData        String?   // JSON: parsed data
  
  createdAt       DateTime @default(now())
  job             CrawlJob @relation(...)
  
  @@index([contentHash])
}
```

## Usage Examples

### 1. Basic HTML Parsing

```typescript
import { parseHTML } from '@/lib/html-parser';

const html = await page.content();
const parsed = parseHTML(html);

console.log(parsed.title);
console.log(parsed.headings.h1);
console.log(parsed.links.length);
console.log(parsed.wordCount);
```

### 2. Extract JSON-LD

```typescript
import { extractJSONLD } from '@/lib/html-parser';

const html = await page.content();
const jsonLD = extractJSONLD(html);

jsonLD.forEach(data => {
  if (data['@type'] === 'Product') {
    console.log('Product:', data.name, data.price);
  }
});
```

### 3. Extract Metadata

```typescript
import { extractMetadata } from '@/lib/html-parser';

const html = await page.content();
const meta = extractMetadata(html);

console.log('Canonical:', meta.canonical);
console.log('Author:', meta.author);
console.log('Published:', meta.publishDate);
```

### 4. Custom Extractors (Per Domain)

Define custom selectors for specific sites:

```typescript
import { customExtract } from '@/lib/html-parser';

const config = {
  selectors: {
    productName: 'h1.product-title',
    price: 'span.price',
    stock: 'div.stock-status',
    rating: 'span.rating',
    reviews: 'div.review',
  },
  extractType: 'text',
};

const data = customExtract(html, config);
console.log(data);
// {
//   productName: "Example Product",
//   price: "$99.99",
//   stock: "In Stock",
//   rating: "4.5",
//   reviews: ["Great!", "Love it!"]
// }
```

### 5. Ollama AI Analysis (Optional)

Analyze content with AI:

```typescript
import { analyzeWithOllama, classifyPage } from '@/lib/ollama-analyzer';

// Summarize
const summary = await analyzeWithOllama(bodyText, 'summarize');
console.log(summary.summary);

// Classify page type
const pageType = await classifyPage(bodyText, title);
console.log(pageType); // "product", "article", "blog", etc.

// Extract structured data with AI
const extracted = await analyzeWithOllama(
  bodyText,
  'extract',
  'Extract: product name, price, features as JSON'
);
console.log(extracted.extractedData);

// Sentiment analysis
const sentiment = await analyzeWithOllama(bodyText, 'sentiment');
console.log(sentiment.sentiment); // "positive", "negative", "neutral"
```

## API Endpoints

### Get Structured Data

```bash
GET /api/jobs/:id?includeResults=true
```

Response:

```json
{
  "id": "...",
  "url": "https://example.com/product",
  "status": "completed",
  "results": [
    {
      "id": "...",
      "url": "...",
      "structuredData": "{\"@type\":\"Product\",...}",
      "metadata": "{\"canonical\":\"...\",\"author\":\"...\"}",
      "extractedText": "Product description...",
      "contentHash": "a3f5e9b2...",
      "apiResponses": "{\"https://api.example.com/product\":...}"
    }
  ]
}
```

### Export Data

```bash
GET /api/sessions/:id/export?format=json
GET /api/sessions/:id/export?format=csv
GET /api/sessions/:id/export?format=ndjson
```

**JSON Export:**
```json
[
  {
    "url": "https://example.com/page1",
    "title": "Page Title",
    "structuredData": {...},
    "metadata": {...},
    "crawledAt": "2025-01-03T..."
  }
]
```

**CSV Export:**
```csv
url,title,wordCount,author,publishDate,contentHash
https://example.com/page1,Page Title,1234,John Doe,2025-01-01,a3f5e9b2...
```

**NDJSON Export:**
```
{"url":"https://example.com/page1","title":"..."}
{"url":"https://example.com/page2","title":"..."}
```

## UI Features

### 1. Structured Data Viewer

On the job detail page (`/jobs/:id`), you can now view:

- **HTML Preview Tab**: Rendered HTML
- **Structured Data Tab**: JSON-LD viewer with syntax highlighting
- **API Responses Tab**: All captured XHR/Fetch calls
- **Metadata Tab**: Extracted metadata
- **Screenshot Tab**: Visual capture

### 2. Export Button

Download all session data in your preferred format:

```
[Session Detail Page]
  ↓
[Export Button]
  ↓
[Choose Format: JSON / CSV / NDJSON]
  ↓
[Download file]
```

### 3. Search & Filter

Filter results by:
- Content type (product, article, blog)
- Has JSON-LD data
- Has API responses
- Word count range
- Publication date

## Deduplication

Content is automatically deduplicated:

1. **URL Normalization**
   - Remove tracking params
   - Lowercase hostname
   - Sort query params

2. **Content Hashing**
   - SHA-256 hash of body text
   - Skip pages with same hash
   - Saves storage & processing time

3. **Canonical URLs**
   - Use `<link rel="canonical">` if available
   - Merge duplicate content

## Ollama Integration

### Setup

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull model
ollama pull llama2

# Start server (default: http://localhost:11434)
ollama serve
```

### Configuration

Set in `.env`:

```bash
OLLAMA_API_URL=http://localhost:11434
```

### Use Cases

**1. Content Classification**
```typescript
const pageType = await classifyPage(bodyText, title);
// Automatically categorize: product, article, news, etc.
```

**2. Automatic Summarization**
```typescript
const summary = await analyzeWithOllama(bodyText, 'summarize');
// Get 2-3 sentence summary
```

**3. Structured Extraction**
```typescript
const extracted = await analyzeWithOllama(
  bodyText,
  'extract',
  'Extract person names, organizations, and locations as JSON'
);
```

**4. Sentiment Analysis**
```typescript
const sentiment = await analyzeWithOllama(content, 'sentiment');
// positive / negative / neutral
```

## Custom Extractors

Create domain-specific extractors in `DomainConfig`:

```typescript
// E-commerce site
{
  domain: "shop.example.com",
  customExtractor: {
    selectors: {
      productName: "h1.product-name",
      price: "span.price",
      originalPrice: "span.original-price",
      discount: "span.discount",
      stock: "div.availability",
      sku: "span.sku",
      brand: "a.brand-link",
      rating: "div.rating span",
      reviewCount: "span.review-count",
      images: "img.product-image",
      description: "div.description",
      specifications: "table.specs tr",
    }
  }
}

// News site
{
  domain: "news.example.com",
  customExtractor: {
    selectors: {
      headline: "h1.headline",
      subheadline: "h2.subheadline",
      author: "span.author-name",
      publishDate: "time.publish-date",
      category: "a.category",
      tags: "a.tag",
      body: "div.article-body",
      relatedArticles: "a.related-article",
    }
  }
}
```

## Best Practices

### 1. Choose Right Extraction Method

| Content Type | Best Method |
|--------------|-------------|
| E-commerce product pages | JSON-LD + Custom selectors |
| News/Blog articles | JSON-LD + Metadata |
| Documentation sites | HTML parsing + Links |
| SPA/CSR sites | API response capture |
| General sites | All methods combined |

### 2. Handle Missing Data

Always check if data exists:

```typescript
const title = parsed.title || 'Untitled';
const author = metadata.author || 'Unknown';
const jsonLD = extractJSONLD(html) || [];
```

### 3. Validate Extracted Data

```typescript
if (jsonLD.length > 0) {
  for (const data of jsonLD) {
    if (data['@type'] === 'Product') {
      // Validate required fields
      if (!data.name || !data.price) {
        console.warn('Invalid product data');
      }
    }
  }
}
```

### 4. Performance

- Use `extractedText` (limited to 10k chars) for AI analysis
- Full `htmlContent` stored separately for reference
- `contentHash` indexed for fast lookups

### 5. Privacy

- Remove sensitive data before storage
- Don't capture authentication cookies
- Respect robots.txt and privacy policies

## Examples by Use Case

### SEO Audit

```typescript
// Check meta tags, headings, word count
const parsed = parseHTML(html);
const meta = extractMetadata(html);

const seoReport = {
  title: parsed.title,
  titleLength: parsed.title.length, // Should be 50-60 chars
  metaDescription: parsed.metaDescription,
  metaDescLength: parsed.metaDescription.length, // Should be 150-160 chars
  h1Count: parsed.headings.h1.length, // Should be 1
  h2Count: parsed.headings.h2.length,
  wordCount: parsed.wordCount, // Should be 300+
  imageCount: parsed.images.length,
  imagesWithAlt: parsed.images.filter(img => img.alt).length,
  internalLinks: parsed.links.filter(l => l.href.startsWith('/')).length,
  externalLinks: parsed.links.filter(l => l.href.startsWith('http')).length,
  canonical: meta.canonical,
  language: meta.language,
  robots: meta.robots,
};
```

### Price Monitoring

```typescript
// Extract product data
const jsonLD = extractJSONLD(html);
const product = jsonLD.find(d => d['@type'] === 'Product');

if (product) {
  await db.priceHistory.create({
    sku: product.sku,
    name: product.name,
    price: parseFloat(product.offers.price),
    currency: product.offers.priceCurrency,
    availability: product.offers.availability,
    checkedAt: new Date(),
  });
}
```

### Content Aggregation

```typescript
// Extract articles
const jsonLD = extractJSONLD(html);
const article = jsonLD.find(d => d['@type'] === 'Article');

if (article) {
  await db.articles.create({
    headline: article.headline,
    author: article.author?.name,
    publishDate: article.datePublished,
    image: article.image,
    description: article.description,
    url: article.url,
  });
}
```

---

**🎉 Your crawler now extracts real data, not just screenshots!**
