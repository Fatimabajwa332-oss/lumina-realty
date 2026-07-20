# Lumina Realty 🏡

A full-stack luxury real estate platform featuring AI-powered property search, agent portfolios, and a complete booking/inquiry system.

**Live Demo:** _Coming soon_
**Repository:** https://github.com/Fatimabajwa332-oss/lumina-realty

---

## ✨ Features

- 🏠 **Property Listings** — Browse curated luxury properties with real-time filtering by price and amenities
- 🤖 **AI Assistant** — Chat with a Google Gemini-powered assistant that searches real listings and answers questions about properties, neighborhoods, and financing
- 👤 **User Authentication** — Secure signup/login with hashed passwords (bcrypt)
- 🧑‍💼 **Agent Portfolios** — Each agent has a dedicated page showing their active listings
- 📩 **Inquiry System** — "Request a Private Tour" form saves directly to the database
- 📍 **Interactive Maps** — Embedded Google Maps for property locations and office address
- 📱 **Responsive Design** — Fully functional on mobile and desktop

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| AI | Google Gemini API |
| Auth | bcryptjs (password hashing) |

## 📂 Project Structure

```
lumina-realty/
├── lumina-backend/          # Node.js + Express API server
│   ├── server.js            # All API routes
│   ├── db.js                # MySQL connection pool
│   └── package.json
│
└── lumina-realty-html/      # Frontend
    ├── index.html           # Homepage
    ├── browse.html          # Property listings + filters
    ├── property.html        # Property detail page
    ├── agents.html          # Meet the agents
    ├── portfolio.html       # Individual agent's listings
    ├── login.html / signup.html
    ├── css/
    ├── js/
    └── images/
```

## 🚀 Running Locally

**Prerequisites:** Node.js, MySQL (e.g. via XAMPP)

1. Clone the repo
   ```bash
   git clone https://github.com/Fatimabajwa332-oss/lumina-realty.git
   ```

2. Set up the database
   - Create a MySQL database named `lumina_realty`
   - Import the schema (tables: `agents`, `properties`, `amenities`, `users`, `favorites`, `inquiries`)

3. Configure the backend
   ```bash
   cd lumina-backend
   npm install
   ```
   Create a `.env` file:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=lumina_realty
   PORT=5000
   GEMINI_API_KEY=your_key_here
   ```

4. Start the backend
   ```bash
   node server.js
   ```

5. Open the frontend
   - Open `lumina-realty-html/index.html` with VSCode's Live Server extension

## 📸 Screenshots

_Add screenshots of the homepage, browse page, and property detail page here._

## 👩‍💻 Built By

Fatima Bajwa — [Fiverr Profile](#)

---

*This project was built as a portfolio piece demonstrating full-stack web development with AI integration.*
