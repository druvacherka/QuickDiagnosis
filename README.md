<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Python-ML-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

# 🩺 QuickDiagnosis

> **AI-powered symptom analysis and disease prediction system** — Enter your symptoms, get instant ML-driven predictions, follow-up questionnaires, and find nearby hospitals & specialists in real-time.

QuickDiagnosis is a full-stack healthcare application that leverages a **Random Forest classifier** trained on a medical symptoms dataset to predict potential diseases from user-reported symptoms. It goes beyond basic prediction by offering follow-up diagnostic questions, disease-specific precautions, specialist recommendations, and a location-based hospital finder.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔍 **Symptom Analysis** | Select symptoms from a medical database with smart search & autocomplete |
| 🤖 **ML Predictions** | Random Forest classifier returns top-3 disease predictions with confidence scores |
| ❓ **Follow-Up Questionnaire** | Dynamic follow-up questions based on characteristic symptoms for each predicted disease |
| 📊 **Detailed Results** | Confidence percentages, disease descriptions, and recommended precautions |
| 🏥 **Hospital Finder** | Locate nearby hospitals & specialists within a 10 km radius using OpenStreetMap |
| 🗺️ **Interactive Maps** | Visual map with hospital markers powered by Leaflet / Geoapify |
| 👤 **User Profiles** | Register, login, email verification, password recovery, and personal health profiles |
| 📋 **Diagnosis History** | Persistent diagnosis records stored in MongoDB and synced across sessions |
| 💡 **Daily Health Tips** | Rotating tips from a curated database of 112+ health tips |
| 🛡️ **Precautions** | Disease-specific precautionary advice from a built-in knowledge base |
| 🔔 **Notifications** | In-app notification system for health tips and alerts |
| 🔒 **Security** | JWT authentication, bcrypt password hashing, Helmet headers, and rate limiting |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19)                 │
│  Vite · React Router v7 · Lucide Icons · Axios         │
│                                                         │
│  Pages: Home · Login · Register · Dashboard · Symptoms  │
│         Results · Hospitals · Profile · ForgotPassword   │
│         VerifyEmail                                     │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (HTTP)
┌────────────────────────▼────────────────────────────────┐
│                  BACKEND (Express 5)                    │
│  Helmet · CORS · Rate Limiter · JWT Auth Middleware     │
│                                                         │
│  Routes: /api/auth/*  · /api/predict · /api/symptoms   │
│          /api/hospitals · /api/health-tips              │
│          /api/precautions · /api/history                │
├─────────────────────────────────────────────────────────┤
│  Services:                                              │
│  ┌──────────────┐ ┌───────────────┐ ┌────────────────┐ │
│  │  ML Service   │ │  Maps Service │ │ Email Service  │ │
│  │  (Python RF)  │ │  (OSM/Overpass│ │ (Nodemailer)   │ │
│  └──────┬───────┘ │   + Nominatim)│ └────────────────┘ │
│         │         └───────────────┘                     │
│         ▼                                               │
│  ┌──────────────┐                                       │
│  │  predict.py   │  scikit-learn Random Forest          │
│  │  train.py     │  joblib model serialization          │
│  └──────────────┘                                       │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   MongoDB Database  │
              │  Users · Diagnoses  │
              │       · OTPs        │
              └─────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite 7 for blazing-fast HMR
- **React Router v7** for client-side routing
- **Axios** for HTTP requests
- **Lucide React** for modern iconography
- **Vanilla CSS** with custom design system (glassmorphism, gradients, animations)

### Backend
- **Express 5** (Node.js) REST API
- **Mongoose 9** (MongoDB ODM)
- **JWT** (JSON Web Tokens) for authentication
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **express-rate-limit** for API throttling
- **Nodemailer** for email verification & password recovery
- **csv-parser** for dataset processing
- **natural** (NLP library) for text processing

### Machine Learning
- **Python 3** with scikit-learn
- **Random Forest Classifier** (100 estimators)
- **joblib** for model serialization
- **pandas / numpy** for data processing
- Training dataset: **1.3 MB** CSV with symptom-disease mappings

### Location Services
- **OpenStreetMap Overpass API** — primary hospital search
- **Nominatim** — geocoding fallback
- **Geoapify** — map tiles and location services

---

## 📁 Project Structure

```
QuickDiagnosis/
├── public/                          # Static assets
├── src/                             # Frontend source
│   ├── components/
│   │   └── layout/
│   │       ├── Layout.jsx           # App shell wrapper
│   │       ├── Navbar.jsx           # Navigation bar with auth state
│   │       ├── Footer.jsx           # Site footer
│   │       ├── NotificationPanel.jsx # Notification drawer
│   │       └── NotificationCard.jsx  # Individual notification component
│   ├── context/
│   │   └── NotificationContext.jsx  # Global notification state
│   ├── pages/
│   │   ├── Home.jsx                 # Landing page
│   │   ├── Login.jsx                # Login with JWT
│   │   ├── Register.jsx             # Registration with email verification
│   │   ├── VerifyEmail.jsx          # Email verification flow
│   │   ├── ForgotPassword.jsx       # Password recovery
│   │   ├── Dashboard.jsx            # User dashboard with history, tips, precautions
│   │   ├── Symptoms.jsx             # Symptom selection interface
│   │   ├── Results.jsx              # Prediction results with confidence scores
│   │   ├── Hospitals.jsx            # Nearby hospital finder with map
│   │   └── Profile.jsx              # User profile management
│   ├── services/
│   │   └── api.js                   # Frontend API client
│   ├── data/
│   │   ├── train_disease.csv        # Training dataset
│   │   └── test_disease.csv         # Test dataset
│   ├── App.jsx                      # Root component with routing
│   ├── main.jsx                     # Entry point
│   ├── index.css                    # Global styles & design system
│   └── App.css                      # App-level styles
│
├── server/                          # Backend source
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── specialties.js           # Disease → Specialist mapping (40+ diseases)
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification middleware
│   ├── models/
│   │   ├── User.js                  # User schema (profile, health data)
│   │   ├── Diagnosis.js             # Diagnosis history schema
│   │   └── Otp.js                   # OTP schema for verification
│   ├── routes/
│   │   ├── api.js                   # Core API routes (predict, symptoms, hospitals)
│   │   └── auth.js                  # Auth routes (register, login, verify, reset)
│   ├── services/
│   │   ├── mlService.js             # ML bridge (trains & calls Python scripts)
│   │   ├── predict.py               # Python prediction script (Random Forest)
│   │   ├── train.py                 # Python training script
│   │   ├── mapsService.js           # Hospital search via OSM Overpass + Nominatim
│   │   └── encryptionService.js     # AES-256 encryption utilities
│   ├── utils/
│   │   └── sendEmail.js             # Email transporter (Gmail SMTP)
│   ├── data/
│   │   ├── train_disease.csv        # Training dataset
│   │   ├── rf_model.joblib          # Trained Random Forest model
│   │   ├── label_encoder.joblib     # Label encoder for diseases
│   │   ├── symptoms.json            # Extracted symptom feature list
│   │   ├── health_tips.json         # 112+ curated health tips
│   │   └── precautions.json         # Disease-specific precautions
│   ├── index.js                     # Server entry point
│   ├── .env                         # Server environment variables
│   └── package.json                 # Server dependencies
│
├── .gitignore
├── package.json                     # Root dependencies & scripts
├── vite.config.js                   # Vite configuration
├── eslint.config.js                 # ESLint configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| **Node.js** | v18+ |
| **Python** | 3.8+ |
| **MongoDB** | 6.0+ (local or Atlas) |
| **pip packages** | `scikit-learn`, `pandas`, `numpy`, `joblib` |

### 1. Clone the Repository

```bash
git clone https://github.com/druvacherka/QuickDiagnosis.git
cd QuickDiagnosis
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Install Python ML Dependencies

```bash
pip install scikit-learn pandas numpy joblib
```

### 4. Configure Environment Variables

Create a `server/.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/quickdiagnosis
JWT_SECRET=your_jwt_secret_key_here
ENCRYPTION_KEY=32_character_random_string_for_aes_256
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GEOAPIFY_API_KEY=your_geoapify_key
```

> **Note:** For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

### 5. Start the Application

```bash
# Starts both frontend (Vite) and backend (Express) concurrently
npm run dev
```

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5000` |
| Health Check | `http://localhost:5000/health` |

> The ML model is automatically trained on server startup using the training dataset.

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login with email & password |
| `POST` | `/api/auth/verify-email` | Verify email with OTP |
| `POST` | `/api/auth/forgot-password` | Initiate password reset |
| `POST` | `/api/auth/reset-password` | Reset password with security question |

### Core Features

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/symptoms` | Get all available symptoms |
| `POST` | `/api/predict` | Predict diseases from symptoms |
| `GET` | `/api/hospitals` | Find nearby hospitals (lat, lng, disease) |
| `GET` | `/api/health-tips` | Get a random daily health tip |
| `GET` | `/api/precautions/:disease` | Get precautions for a specific disease |

### User Data

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/history` | Get diagnosis history (auth required) |
| `DELETE` | `/api/auth/history` | Clear diagnosis history (auth required) |
| `PUT` | `/api/auth/profile` | Update user profile (auth required) |

---

## 🧠 How the ML Pipeline Works

1. **Training** (`train.py`):  
   - Reads `train_disease.csv` (4,920 rows × 132 symptom columns)  
   - Encodes disease labels with `LabelEncoder`  
   - Trains a `RandomForestClassifier` with 100 estimators  
   - Saves `rf_model.joblib`, `label_encoder.joblib`, and `symptoms.json`

2. **Prediction** (`predict.py`):  
   - Converts user symptoms into a binary feature vector  
   - Runs `predict_proba()` to get class probabilities  
   - Returns top-3 predictions sorted by probability  
   - Identifies **missing characteristic symptoms** for follow-up questions

3. **Follow-Up Refinement**:  
   - For each predicted disease, compares user symptoms against characteristic symptoms  
   - Asks the user about missing symptoms to refine confidence  
   - Final confidence = `(matched / total_characteristic) − penalty`

---

## 🗺️ Hospital Finder

The hospital finder uses a **3-layer fallback strategy** to ensure results:

1. **Overpass API** (primary) — queries OpenStreetMap for hospitals within 10 km  
2. **Overpass Mirror** (secondary) — tries `overpass.kumi.systems` if primary fails  
3. **Nominatim** (tertiary) — geocoded search as a last resort  

Results are deduplicated, sorted by distance, and optionally filtered by disease relevance using an intelligent filtering system.

---

## 📸 Application Flow

```
Register / Login  →  Dashboard  →  Select Symptoms  →  ML Prediction
      │                  │                                    │
      │            View History                        Follow-Up Q&A
      │            Health Tips                                │
      │            Precautions                        Refined Results
      │                                                       │
      └──── Profile ────────────────────────── Find Hospitals ┘
                                                (Map + Directions)
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Commit** your changes: `git commit -m "feat: add your feature"`
4. **Push** to the branch: `git push origin feature/your-feature`
5. **Open** a Pull Request

---

## ⚠️ Disclaimer

> QuickDiagnosis is designed for **informational and educational purposes only**. It is **not a substitute for professional medical advice**, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.

---


<!-- <p align="center">
  Built with ❤️ by <a href="https://github.com/druvacherka">druvacherka</a>
</p> -->
