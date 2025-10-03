# Scrapture 🕷️

**Scrapture** is a powerful, self-hosted web scraping framework built with Next.js, Playwright, and BullMQ. It features a beautiful neumorphism design dashboard for monitoring crawl jobs, viewing results, and managing configurations.

## ✨ Features

- 🎨 **Neumorphism UI** - Beautiful, modern dashboard with dark mode support
- 🤖 **Playwright Integration** - Scrape SSR & CSR pages with auto-scroll support
- 📊 **Job Queue System** - BullMQ + Redis for reliable job processing
- 🔍 **API Response Capture** - Automatically capture XHR/API responses
- 📸 **Screenshot Support** - Take full-page screenshots
- 🧠 **AI Extraction** - Optional Ollama integration for intelligent data extraction
- ⚙️ **Domain Configs** - Per-domain rate limiting, delays, and custom selectors
- 📝 **Real-time Logging** - Monitor crawl progress with detailed logs
- 🐳 **Docker Ready** - Complete Docker Compose setup
- 💻 **CLI Tool** - Command-line interface for quick crawls

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Crawler**: Playwright (Chromium)
- **Queue**: BullMQ + Redis
- **Database**: SQLite (default) or PostgreSQL
- **Charts**: Recharts
- **State**: Zustand
- **AI**: Ollama (optional)

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Redis (or use Docker)
- Ollama (optional, for AI extraction)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd scrapture
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
```

Edit `.env` if needed:
```env
DATABASE_URL="file:./dev.db"
REDIS_URL="redis://localhost:6379"
PORT=3000
NODE_ENV=development
OLLAMA_API_URL="http://localhost:11434"
```

4. **Initialize database**
```bash
npm run db:push
npm run db:generate
```

5. **Install Playwright browsers**
```bash
npx playwright install chromium
```

### Running Locally

1. **Start Redis** (if not using Docker)
```bash
redis-server
```

2. **Start the Next.js development server**
```bash
npm run dev
```

3. **Start the worker** (in a new terminal)
```bash
npm run worker
```

4. **Open the dashboard**
```
http://localhost:3000
```

### Docker Deployment

The easiest way to run Scrapture is with Docker Compose:

```bash
npm run docker:up
```

This will start:
- Redis server
- Next.js app (port 3000)
- BullMQ worker

**Stop services:**
```bash
npm run docker:down
```

**View logs:**
```bash
npm run docker:logs
```

## 📖 Usage

### Dashboard

The main dashboard provides:
- Quick job submission form
- Real-time job statistics
- Visual charts for job status
- Navigation to all features

### Jobs Management

View and monitor all crawl jobs:
- Filter by status (pending, queued, running, completed, failed)
- Click any job to see detailed results
- Real-time updates every 3 seconds

### Results Viewer

Browse completed crawls:
- Thumbnail previews
- Screenshot gallery
- Extracted JSON data
- API responses captured

### Domain Configs

Create per-domain configurations:
- Custom delays between requests
- Concurrency limits
- Rate limiting
- Custom user agents
- CSS selectors for data extraction
- Enable AI extraction with Ollama

### Logs Viewer

Monitor system logs:
- Real-time log streaming
- Filter by level (info, warn, error)
- Job-specific logs
- Timestamps and detailed messages

## 💻 CLI Usage

Scrapture includes a powerful CLI for quick operations:

**Queue a new crawl:**
```bash
npm run cli crawl https://example.com
```

**With options:**
```bash
npm run cli crawl https://example.com --priority 10 --no-screenshot
```

**View job statistics:**
```bash
npm run cli status
```

## 🔌 API Endpoints

### Jobs
- `GET /api/jobs` - List all jobs (query: `?status=completed&limit=50`)
- `POST /api/jobs` - Create new crawl job
- `GET /api/jobs/[id]` - Get job details
- `DELETE /api/jobs/[id]` - Delete job

### Stats
- `GET /api/stats` - Get job statistics

### Configs
- `GET /api/configs` - List domain configs
- `POST /api/configs` - Create new config
- `GET /api/configs/[id]` - Get config
- `PUT /api/configs/[id]` - Update config
- `DELETE /api/configs/[id]` - Delete config

## 🤖 Ollama Integration

Scrapture can use Ollama for intelligent data extraction from HTML.

1. **Install Ollama**
```bash
# Visit https://ollama.ai for installation
ollama pull llama2
```

2. **Enable in Domain Config**
- Go to Configs page
- Create or edit a domain config
- Check "Enable AI Extraction"
- Add a custom prompt (e.g., "Extract product title, price, and description")

3. **Results**
- AI-extracted data will appear in job results
- Look for `aiExtracted` field in JSON data

## 📁 Project Structure

```
scrapture/
├── src/
│   ├── app/                # Next.js pages
│   │   ├── api/           # API routes
│   │   ├── jobs/          # Jobs pages
│   │   ├── configs/       # Config pages
│   │   ├── results/       # Results pages
│   │   └── logs/          # Logs pages
│   ├── components/        # React components
│   │   ├── NeuCard.tsx
│   │   ├── NeuButton.tsx
│   │   ├── NeuInput.tsx
│   │   ├── Sidebar.tsx
│   │   └── DarkModeToggle.tsx
│   ├── lib/               # Core libraries
│   │   ├── crawler.ts     # Playwright crawler
│   │   ├── queue.ts       # BullMQ setup
│   │   └── db.ts          # Prisma client
│   ├── types/             # TypeScript types
│   └── generated/         # Prisma generated client
├── prisma/
│   └── schema.prisma      # Database schema
├── public/
│   └── screenshots/       # Captured screenshots
├── worker.ts              # BullMQ worker process
├── cli.ts                 # CLI tool
├── docker-compose.yml     # Docker setup
├── Dockerfile             # App container
└── Dockerfile.worker      # Worker container
```

## 🎨 Customization

### Neumorphism Colors

Edit `src/app/globals.css` to customize the neumorphism theme:

```css
:root {
  --background: #e0e5ec;
  --foreground: #2c3e50;
  --shadow-light: #ffffff;
  --shadow-dark: #a3b1c6;
}

[data-theme="dark"] {
  --background: #1a1a2e;
  --foreground: #eaeaea;
  --shadow-light: #252540;
  --shadow-dark: #0f0f1e;
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Playwright](https://playwright.dev/)
- Queue system by [BullMQ](https://docs.bullmq.io/)
- UI inspired by neumorphism design principles

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Happy Scraping! 🕷️✨**
