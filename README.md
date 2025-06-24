# 🕌 Saut Al-Qur’an (صوت القرآن)

**Perfect your Qur’an recitation with guidance from certified scholars.**

Saut Al-Qur’an is a Progressive Web App (PWA) that allows users to record their Qur’an recitation and receive detailed, timestamped feedback from professional scholars. The app is lightweight, mobile-first, and optimized for regions with limited internet access.

---

## 📦 Tech Stack

| Layer         | Tech                     |
| ------------- | ------------------------ |
| Frontend      | React + TypeScript (PWA) |
| Backend       | FastAPI                  |
| Database      | PostgreSQL               |
| Deployment    | Docker + Docker Compose  |
| Reverse Proxy | Nginx (optional)         |

---

## 🚀 Features

-   🎙️ Record and upload Qur’an recitation
-   🔁 Repeat loops for difficult ayahs
-   🔖 Timestamped markers and annotations
-   💬 Text/audio feedback from certified scholars
-   📈 Track your recitation progress
-   📱 Works offline (PWA)

---

## 📁 Project Structure

```

saut-al-quran/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/              # API routers (modular)
│   │   ├── core/             # Configs, settings, dependencies
│   │   ├── models/           # Pydantic and ORM models
│   │   ├── services/         # Business logic (e.g., audio handling, feedback)
│   │   ├── db/               # DB sessions and initialization
│   │   ├── schemas/          # Pydantic schemas (DTOs)
│   │   └── main.py           # FastAPI app entry point
│   └── Dockerfile            # FastAPI container
│
├── frontend/                 # React + TypeScript PWA
│   ├── public/               # Static files, PWA manifest
│   ├── src/
│   │   ├── assets/           # Icons, images, etc.
│   │   ├── components/       # Reusable UI components
│   │   ├── features/         # Feature folders (e.g., Recording, Feedback)
│   │   ├── hooks/            # Custom hooks (e.g., useRecorder, useZoom)
│   │   ├── pages/            # Route-based components
│   │   ├── services/         # API calls to FastAPI backend
│   │   ├── types/            # TypeScript types/interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── Dockerfile            # Frontend container
│
├── docker-compose.yml        # Main container orchestration
├── nginx/                    # (Optional) reverse proxy config
│   └── nginx.conf
├── .env                      # Environment variables
├── README.md
└── .gitignore


```

---

## 🐳 Running the App with Docker Compose

1. **Clone the repo:**

```bash
git clone https://github.com/dsbtek/saut-al-quran.git
cd saut-al-quran
```

2. **Set environment variables in `.env`:**

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=strongpassword123
POSTGRES_DB=sautalquran
DATABASE_URL=postgresql://admin:strongpassword123@db:5432/sautalquran
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REACT_APP_API_URL=http://localhost:8000
```

3. **Start all services:**

```bash
docker-compose up --build
```

4. **Access the app:**

-   Frontend: [http://localhost:3000](http://localhost:3000)
-   Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)
-   PostgreSQL: localhost:5432

## 🛠️ Development Setup

### Backend Development

1. **Navigate to backend directory:**

```bash
cd backend
```

2. **Create virtual environment:**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**

```bash
pip install -r requirements.txt
```

4. **Run the backend:**

```bash
uvicorn app.main:app --reload
```

5. **Run tests:**

```bash
pytest
```

### Frontend Development

1. **Navigate to frontend directory:**

```bash
cd frontend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Start development server:**

```bash
npm start
```

4. **Run tests:**

```bash
npm test
```

5. **Build for production:**

```bash
npm run build
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest test_main.py -v
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📱 PWA Features

The app includes Progressive Web App features:

-   **Offline Support**: Record and save recitations offline
-   **Background Sync**: Automatically upload when connection is restored
-   **Installable**: Add to home screen on mobile devices
-   **Service Worker**: Caches resources for offline use

## 🔐 Default Users

The app creates default users on startup:

-   **Admin**: username: `admin`, password: `admin123`
-   **Scholar**: username: `scholar1`, password: `scholar123`
-   **User**: username: `testuser`, password: `user123`

**⚠️ Change these passwords in production!**

## 🤝 Contributing

We welcome contributions from Qur’an educators, developers, and open-source contributors.

```bash
# Example: run backend alone
cd backend
uvicorn app.main:app --reload
```

---

## 📜 License

MIT License. © 2024 Muhammad & Contributors

---

**Saut Al-Qur’an – Amplify your recitation. Beautify your connection.**

```

```
