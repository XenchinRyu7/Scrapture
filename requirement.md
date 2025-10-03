Buatkan project open source self-hosted untuk scraping framework dengan stack berikut:

* **Frontend & Dashboard**: Next.js (TypeScript) + Tailwind CSS, dengan gaya **neumorphism design**. Dashboard berfungsi untuk:

  * Monitoring job (queued, running, finished, failed).
  * Lihat hasil crawl (HTML, JSON, screenshot).
  * Config management (domain rules, rate limit, selectors).
  * Logs viewer.
  * Opsional: export data ke CSV/JSON.

* **Crawler Core**:

  * Gunakan **Playwright** untuk fetch halaman SSR & CSR.
  * Support auto-scroll untuk infinite scroll.
  * Capture API/XHR responses bila ada.
  * Simpan hasil (HTML, JSON, screenshot).
  * Configurable per domain (delay, concurrency, selectors).

* **Queue & Scheduler**:

  * Gunakan **BullMQ + Redis**.
  * Atur rate limit & retry/backoff per domain.
  * Dashboard bisa trigger “enqueue new crawl”.

* **Database & Storage**:

  * Default: SQLite (untuk single-user).
  * Optional: Postgres (untuk scale).
  * Simpan metadata job, hasil crawl, logs.

* **Deployment**:

  * Siapkan **Docker Compose** untuk app + Redis + DB.
  * Configurable lewat `.env` (DB_URL, REDIS_URL, PORT, dll).

* **Ekstensi Keren (Bonus)**:

  * Integrasi **Ollama**:

    * Tambahkan fitur AI extractor: hasil HTML bisa di-parse ke field tertentu (judul, harga, tanggal) dengan Ollama model lokal.
    * User bisa aktifkan mode ini di dashboard → hasil extraction otomatis lewat LLM.
    * Buat modul AI agent kecil untuk integrasi Ollama API (`http://localhost:11434` default).

* **UI/UX**:

  * Neumorphism design dengan Tailwind.
  * Dark mode toggle.
  * Job status pakai card neumorphism.
  * Simple chart untuk statistik job (pakai recharts).

* **Target**:

  * Open source, self-hosted, user cukup clone repo + `docker compose up` untuk jalan.
  * CLI kecil opsional (`npx crawler-cli crawl https://example.com`) untuk jalan tanpa dashboard.

Output yang diharapkan:

* Struktur project (Next.js monorepo / app dir).
* Modul worker Playwright terpisah tapi tetap dalam monorepo.
* Konfigurasi BullMQ queue.
* Next.js API routes untuk enqueue job, fetch results, lihat logs.
* Dashboard page dengan neumorphism design (Tailwind).
* Integrasi Ollama extractor (opsional, toggle di config/dashboard).
* Docker Compose file lengkap (app + redis + postgres/sqlite).
* Dokumentasi singkat (README) untuk run.
