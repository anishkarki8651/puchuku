# Puchuku 🎬✨

**Ultra-Premium Cinematic Gallery & Streaming Platform**

Puchuku is a high-end, gallery-style streaming platform built for the ultimate cinematic experience. Moving away from traditional cluttered interfaces, Puchuku treats every movie and TV show like a masterpiece in a digital museum.

![Puchuku Preview](public/puchuku.svg)

---

## 💎 The Gallery Edition Experience

- 🏛️ **Museum-Grade Layout** - Dramatic 10vw margins and massive 160px row spacing for maximum breathing room.
- 🎞️ **Cinematic Hero** - Edge-to-edge 100vh visuals with immersive background trailers that fade in after 3 seconds.
- 🖼️ **Plaque-Style Cards** - High-fashion content cards with glassmorphic information overlays and fluid responsive scaling.
- 🍿 **Cinema Mode (Watch Page)** - A distraction-free viewing environment with a fixed, immersive player and scrollable metadata overlays.
- 🚀 **Premium Loader** - A custom, breathing brand "P" with a cinematic progress bar for a high-end feel from the first second.

## 🛠️ Tech Stack

- **React 18** - UI Architecture
- **Vite** - High-speed Build Tooling
- **Framer Motion** - Silky-smooth professional animations
- **Axios** - Robust API communication
- **TMDb API** - Industry-standard movie/TV metadata
- **Vercel** - Optimized SPA deployment configuration

## 🚀 Getting Started

### 1. Installation

```bash
git clone https://github.com/anishkarki037/puchuku.git
cd puchuku
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory and add your TMDb API key:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

### 2.1 Database Setup

The PHP backend expects a MySQL database named `puchuku_db` (configurable via `api/config.php`).
Run the initial schema located in `api/schema.sql`. If you add profile support later, the optional `api/update_profiles.sql` script will apply the necessary changes.

> **Tip:** The backend now performs an automatic migration check when the profiles endpoint is hit, so missing tables/columns are created on the fly. This helps avoid `500 Internal Server Error` responses when the database hasn't been manually updated.


> [!IMPORTANT]
> To maintain project security, never commit your `.env` file. The project is pre-configured with a `.gitignore` to protect your secrets.

### 3. Launch the Experience

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and immerse yourself.

---

## 🔒 Security & Project Hygiene

- **Environment Isolation**: Sensitive API keys are managed via Vite's `import.meta.env` system and stored in `.env`.
- **Git Protection**: Optimized `.gitignore` ensures `node_modules`, build artifacts, and secrets never leave your local machine.
- **SPA Optimized**: Includes `vercel.json` for perfect client-side routing and deep-link handling on Vercel deployments.

## 📱 Flawless Responsiveness

Puchuku is engineered to look stunning on every device:
- **Ultra-Wide Scaling**: Balanced layouts for 4K and large monitors.
- **Mobile Harmony**: Header buttons transform into intuitive icons, and the episodes drawer expands for comfortable touch use on small screens.

---

## 📜 Legal Notice

This project is for educational and portfolio purposes. It uses third-party streaming embeds. Use responsibly and support the creators of the content you love through official channels.

## 📄 License

MIT © [Anish Karki](https://github.com/anishkarki037)