# 🌾 AgriSmart — Smart Agriculture Platform

> A full-stack web application empowering farmers and transport drivers with AI-driven price prediction, demand forecasting, market locator, crop recommendations, government schemes, and real-time transport management.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [User Roles](#-user-roles)
- [Pages & Routes](#-pages--routes)
- [API Routes](#-api-routes)

---

## ✨ Features

- 🔐 **Authentication** — JWT-based login/signup + Google OAuth
- 🌤️ **Live Weather** — Real-time weather fetched by geolocation
- 📈 **Price Prediction** — AI-based crop price forecasting
- 📊 **Demand Forecast** — Market demand analysis with charts
- 🗺️ **Market Locator** — Find nearby agricultural markets
- 🌱 **Crop Recommendation** — Soil & season-based crop suggestions
- 🏪 **Storage Advice** — Post-harvest storage tips
- 📰 **Agri News** — Latest agriculture news feed
- 🏛️ **Yojana / Govt Schemes** — Browse government schemes for farmers
- 🚛 **Transport Request** — Farmers can book transport for produce
- 🚗 **Driver Dashboard** — Drivers accept/manage transport trips
- 🎙️ **Voice Assistant** — Multilingual voice navigation support
- 🌐 **Multi-language** — Language context support for regional farmers

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React (Vite) | UI Framework |
| React Router DOM | Client-side routing |
| Chart.js + react-chartjs-2 | Data visualization |
| Vanilla CSS | Styling & animations |
| Google OAuth | Social login |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| UUID | Unique ID generation |
| dotenv | Environment config |
| Nodemon | Dev auto-reload |

---

## 📁 Project Structure

```
smart-agri/
├── client/                        # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── VoiceAssistant.jsx
│   │   │   ├── GoogleLoginButton.jsx
│   │   │   ├── NotificationPanel.jsx
│   │   │   └── CropSelector.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── LanguageContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx          # Farmer dashboard
│   │   │   ├── DriverDashboard.jsx    # Driver dashboard
│   │   │   ├── PricePrediction.jsx
│   │   │   ├── DemandForecast.jsx
│   │   │   ├── MarketLocator.jsx
│   │   │   ├── CropRecommendation.jsx
│   │   │   ├── StorageAdvice.jsx
│   │   │   ├── NewsPage.jsx
│   │   │   ├── YojanaPage.jsx
│   │   │   └── TransportRequest.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── .env
│
├── server/                        # Express backend
│   ├── data/
│   │   ├── users.json
│   │   └── trips.json
│   ├── middleware/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── crop.js
│   │   ├── demand.js
│   │   ├── market.js
│   │   ├── news.js
│   │   ├── price.js
│   │   ├── retailer.js
│   │   ├── storage.js
│   │   ├── trips.js
│   │   ├── voice.js
│   │   ├── weather.js
│   │   └── yojana.js
│   ├── utils/
│   ├── server.js
│   └── .env
│
├── nodemon.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/sumit0110816/smart-agri.git
cd smart-agri
```

### 2. Install root dependencies

```bash
npm install
```

### 3. Install client dependencies

```bash
cd client
npm install
cd ..
```

### 4. Install server dependencies

```bash
cd server
npm install
cd ..
```

### 5. Setup environment variables

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your values

# Client
cp client/.env.example client/.env
# Edit client/.env with your values
```

### 6. Run the full project (both client + server)

```bash
npm run dev
```

This starts:
- **Frontend** at `http://localhost:5173`
- **Backend** at `http://localhost:3000`

---

## 🔑 Environment Variables

### `server/.env`

```env
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### `client/.env`

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

> **Note:** Get your Google Client ID from [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client IDs

---

## 👤 User Roles

| Role | Dashboard | Features |
|------|-----------|----------|
| **Farmer** | `/dashboard` | Price prediction, demand forecast, market locator, crop recommendation, storage advice, news, yojana, transport request |
| **Driver** | `/driver-dashboard` | View available trips, accept/complete trips, track earnings |

---

## 📄 Pages & Routes

| Route | Page | Access |
|-------|------|--------|
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/dashboard` | Farmer Dashboard | Farmer only |
| `/driver-dashboard` | Driver Dashboard | Driver only |
| `/price-prediction` | Price Prediction | Protected |
| `/demand-forecast` | Demand Forecast | Protected |
| `/market-locator` | Market Locator | Protected |
| `/crop-recommendation` | Crop Recommendation | Protected |
| `/storage-advice` | Storage Advice | Protected |
| `/news` | Agri News | Protected |
| `/yojana` | Government Schemes | Protected |
| `/transport` | Transport Request | Protected |

---

## 🔌 API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/google` | Google OAuth login |
| `GET` | `/api/weather` | Get live weather data |
| `GET` | `/api/price` | Get crop price predictions |
| `GET` | `/api/demand` | Get demand forecast data |
| `GET` | `/api/market` | Get nearby markets |
| `GET` | `/api/crop` | Get crop recommendations |
| `GET` | `/api/storage` | Get storage advice |
| `GET` | `/api/news` | Get agriculture news |
| `GET` | `/api/yojana` | Get government schemes |
| `GET` | `/api/trips` | Get available trips (Driver) |
| `POST` | `/api/trips` | Create transport request (Farmer) |
| `PATCH` | `/api/trips/:id` | Accept/complete a trip (Driver) |
| `POST` | `/api/voice` | Voice assistant query |

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Authors

- **Sumit** — [@sumit0110816](https://github.com/sumit0110816)
- **Saish** — [@Saish11568](https://github.com/Saish11568)

---

> Built with ❤️ to empower Indian farmers with smart technology.
