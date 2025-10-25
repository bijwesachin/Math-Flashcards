# 4th Grade Math Flashcards

A lightweight, static web app for 4th-grade math flashcards. **Front:** Topic/Subtopic prompt. **Back:** Explanation + Sample.

## 🗂 Structure
```
.
├── index.html
├── script.js
├── styles.css
├── data/
│   └── flashcards.json
└── assets/
    └── icon.png
```

## 🚀 Run
- **GitHub Pages/Netlify:** Just push this folder; it’s fully static.
- **Local preview:** Use a static server (fetch won’t work from file://):
  - Python: `python3 -m http.server 8080`
  - Node: `npx http-server -p 8080`
  - Then open `http://localhost:8080`

## ✍️ Edit Cards
- Add or modify cards in `data/flashcards.json`.
- Each card has: `topic`, `subtopic`, `front`, `back` (back may contain a `\nSample:` section).

## ⌨️ Shortcuts
- **Space**: Flip
- **← / →**: Prev / Next

## 🔎 Filters
- Filter by Topic
- Search across topic, subtopic, front, and back
- Optional Shuffle
