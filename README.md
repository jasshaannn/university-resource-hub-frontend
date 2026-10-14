# University Resource Hub (100% Frontend)

A modern, standalone, zero-backend Campus Operating System for university students.

## 🚀 Features

- **Google Drive Integration**: 467 lecture notes, PPT slide decks, and solved question papers across 23 subjects with instant preview and download directly from Google Drive.
- **Batch Timetables (502 Batches)**: Full weekly schedules across 4 academic years and all engineering/science departments.
- **Calendar Sync (.ics)**: 1-click export of batch schedules to Apple Calendar, Google Calendar, and Microsoft Outlook.
- **Campus Societies Directory**: 41 active student societies with descriptions, official logos, Instagram links, and websites.
- **Campus Events & RSVPs**: University events calendar with persistent RSVP tracking.
- **Dark & Light Modes**: High contrast obsidian dark mode and editorial emerald light mode.
- **Fast Client Search**: Instant search across all subjects, course codes, resources, and societies.

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
university resource hub frontend/
├── package.json          # Project configuration & scripts
├── vite.config.js        # Vite build tool configuration
├── index.html            # Main HTML entry
├── public/               # Static assets & datasets
│   ├── data/             # Publicly fetchable JSON datasets
│   └── favicon.svg       # Brand icon
└── src/
    ├── App.jsx           # Main Campus OS application component
    ├── App.css           # Modern styles & themes
    ├── main.jsx          # React 19 entry point
    ├── data/             # Pre-extracted JSON datasets
    │   ├── subjects.json           # 23 subjects + 467 Google Drive resources
    │   ├── societies.json          # 41 campus societies with links & logos
    │   ├── timetable.json          # 502 batches schedules
    │   ├── timetableHierarchy.json # Years, departments, and batches
    │   └── stats.json              # Totals and counts
    └── services/
        └── api.js        # Client-side data service & .ics generator
```

## 🌐 Deploy to Vercel / Netlify / GitHub Pages

Deploying is instant because there are no databases or server-side functions:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
