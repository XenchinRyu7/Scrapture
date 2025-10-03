# Quick Start Guide

## Prerequisites Check

Before starting, make sure you have:
- ✅ Node.js 20 or higher
- ✅ Redis (or Docker)
- ✅ Git

## Setup in 5 Minutes

### 1. Install Dependencies (Already Done)
```bash
npm install
```

### 2. Start Redis

**Option A: Using Docker**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Option B: Local Redis**
```bash
# Windows (with WSL/chocolatey/scoop)
redis-server

# Mac
brew services start redis

# Linux
sudo systemctl start redis
```

### 3. Start Development

Open **3 terminals**:

**Terminal 1 - Next.js App**
```bash
npm run dev
```

**Terminal 2 - Worker**
```bash
npm run worker
```

**Terminal 3 - Test (Optional)**
```bash
npm run cli crawl https://example.com
```

### 4. Open Dashboard
```
http://localhost:3000
```

## Testing the Crawler

### Via Dashboard
1. Go to http://localhost:3000
2. Enter a URL in the form (try: https://example.com)
3. Click "Start Crawl"
4. Watch it appear in real-time!

### Via CLI
```bash
# Basic crawl
npm run cli crawl https://example.com

# With options
npm run cli crawl https://example.com --priority 10

# Check status
npm run cli status
```

## Common Issues

### "Redis connection failed"
- Make sure Redis is running: `redis-cli ping` (should return PONG)
- Check REDIS_URL in `.env`

### "Port 3000 already in use"
- Change PORT in `.env` to 3001
- Or kill the process: `npx kill-port 3000`

### Worker not processing jobs
- Make sure worker terminal is running
- Check Redis connection
- Look for errors in worker logs

## Docker Deployment

Want to run everything with Docker?

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

## Next Steps

1. **Configure Domains**
   - Go to http://localhost:3000/configs
   - Add domain-specific settings (delays, selectors)

2. **View Results**
   - Go to http://localhost:3000/results
   - Browse screenshots and extracted data

3. **Check Logs**
   - Go to http://localhost:3000/logs
   - Monitor crawler activity

4. **Enable AI** (Optional)
   - Install Ollama: https://ollama.ai
   - Run: `ollama pull llama2`
   - Enable in domain configs

## Features to Try

- ✅ Auto-scroll for infinite scroll pages
- ✅ Screenshot capture
- ✅ API response interception
- ✅ Dark mode toggle
- ✅ Real-time job monitoring
- ✅ Per-domain configurations
- ✅ AI-powered data extraction (with Ollama)

## Need Help?

- Check the full [README.md](./README.md)
- Open an issue on GitHub
- Review the logs in the dashboard

---

Happy Scraping! 🕷️
