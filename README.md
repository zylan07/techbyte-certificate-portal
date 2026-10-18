# TechByte Summit ’26 — Certificate Management Portal

Official Certificate Automation & Management Portal for **TechByte Summit ’26**, organized by the Department of Computer Science and Engineering at KPR Institute of Engineering and Technology, Coimbatore.

---

## Overview

The **TechByte Certificate Portal** is an end-to-end, production-grade certificate automation system engineered to process participant records, validate structured input datasets, dynamically render high-DPI vector PDF certificates, provide real-time interactive previews, generate batch ZIP archives, and dispatch personalized certificates via SMTP email.

---

## Key Features

- **Multi-Workflow Support**: Supports standard technical symposium events, GeeksforGeeks co-branded events, and the official Certificate of Recognition.
- **Spreadsheet Data Ingestion**: Supports `.xlsx`, `.xls`, and `.csv` files with validation, duplicate detection, and downloadable error reports.
- **Fixed Viewport Error Toast**: Real-time pop-up notification with pause-on-hover auto-dismissal for upload formatting and validation failures.
- **High-DPI Vector Certificate Rendering**: ReportLab PDF compilation overlaying recipient data on 2000 × 1414 landscape templates with auto-scaling font math.
- **Interactive Certificate Preview**: Full-screen modal with image overlay, zoom, pagination, and direct single-PDF download.
- **Batch Export**: Instant packaging of verified certificates into session-scoped `.zip` archives.
- **Automated Email Dispatch**: Personalized email delivery with attached certificate PDFs, live progress tracking, delivery reports, and failure retry capability.
- **Modern Technical UI**: Built with React 19, TypeScript, Tailwind CSS, Bebas Neue, Space Grotesk, and JetBrains Mono typography.

---

## Supported Workflows

| # | Event / Certificate Name | Category | Required Columns | Template File |
|---|--------------------------|----------|------------------|---------------|
| 1 | **Paper Presentation** | Participation | `Name`, `College Name`, `Mail ID` | `Paper Presentation Participation.png` |
| 2 | **Project Presentation** | Participation | `Name`, `College Name`, `Mail ID` | `Project Presentation Participation.png` |
| 3 | **Poster Presentation** | Participation | `Name`, `College Name`, `Mail ID` | `Poster Presentation Participation.png` |
| 4 | **Executive Development Programme** | Participation | `Name`, `College Name`, `Mail ID` | `Executive Development Programme Participation.png` |
| 5 | **Conclave on Emergent Trends** | Participation | `Name`, `College Name`, `Mail ID` | `Conclave on Emergent Trends Participation.png` |
| 6 | **Coding Contest** | Participation (GFG) | `Name`, `College Name`, `Mail ID` | `Coding Contest Participation.png` |
| 7 | **12-Hour Hackathon** | Participation (GFG) | `Name`, `College Name`, `Mail ID` | `Hackathon Participation.png` |
| 8 | **Certificate of Recognition** | Honor / Recognition | `Name`, `Class / Section`, `Mail ID` | `Certificate_of_recognition.png` |

---

## Tech Stack

### Frontend
- **Framework**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Typography**: Bebas Neue, Space Grotesk, JetBrains Mono, Inter

### Backend
- **Framework**: Python 3.10+, FastAPI, Uvicorn
- **Data Processing**: pandas, openpyxl
- **PDF & Image Engine**: ReportLab, Pillow (PIL)
- **Environment & Configuration**: python-dotenv, Pydantic

### Email Service
- **Protocol**: SMTP (with TLS/SSL support, configured for Gmail / institutional SMTP)

---

## Repository Structure

```
Certificate_website/
├── .env.example               # Environment variables template
├── .gitignore                  # Git ignore rules for secrets and build artifacts
├── README.md                   # Project documentation
├── requirements.txt            # Python backend dependencies
├── run_portal.py               # Unified application launcher script
├── sample_participants.xlsx    # Safe demo spreadsheet (Participation events)
├── sample_recognition.xlsx     # Safe demo spreadsheet (Recognition workflow)
├── backend/                    # FastAPI application
│   ├── requirements.txt        # Backend dependencies manifest
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint & static SPA serving
│   │   ├── config/             # Events, template coordinates & settings
│   │   ├── models/             # Pydantic schemas & response models
│   │   ├── routes/             # API endpoints (upload, certificates, email)
│   │   ├── services/           # Excel parsing, PDF generation, email dispatch
│   │   └── utils/              # Sanitization & validation utilities
│   └── test_*.py               # Automated backend validation tests
├── frontend/                   # React + Vite application
│   ├── package.json            # Node.js dependencies & scripts
│   ├── vite.config.ts          # Vite build configuration
│   ├── tailwind.config.js      # Design tokens & color system
│   └── src/
│       ├── components/         # Reusable UI components & modals
│       ├── pages/PortalPage.tsx# Main multi-step workflow container
│       ├── services/api.ts     # Frontend API client
│       └── types/              # TypeScript interfaces
├── templates/                  # Official 2000x1414 certificate background PNGs
├── generated/                  # Session certificate cache (gitignored)
└── uploads/                    # Temporary upload storage (gitignored)
```

---

## Local Development & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/techbyte-certificate-portal.git
cd techbyte-certificate-portal
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your SMTP credentials:
```ini
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_gmail_address@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM_EMAIL=your_gmail_address@gmail.com
SMTP_FROM_NAME=Techbyte Summit '26
EMAIL_DRY_RUN=false
```
> **Security Notice**: Never commit `.env` to Git. The `.gitignore` file automatically excludes it.

### 3. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 4. Build or Run Frontend
To build the production frontend bundle (served automatically by FastAPI):
```bash
cd frontend
npm install
npm run build
cd ..
```

For hot-reload frontend development (optional):
```bash
cd frontend
npm run dev
```

### 5. Launch the Portal
Start the unified FastAPI server:
```bash
python run_portal.py
```
Open your browser to:
```
http://127.0.0.1:8000
```

---

## Demo Datasets

The repository includes two safe demonstration datasets with synthetic data:
- `sample_participants.xlsx`: 5 rows formatted for events 1–7 (`Name`, `College Name`, `Mail ID`).
- `sample_recognition.xlsx`: 5 rows formatted for Certificate of Recognition (`Name`, `Class / Section`, `Mail ID`).

---

## Deployment Guidelines (Render / Cloud Hosting)

When deploying to Render or similar cloud platforms:

1. **Build Command**:
   ```bash
   pip install -r requirements.txt && cd frontend && npm install && npm run build && cd ..
   ```
2. **Start Command**:
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
   ```
3. **Environment Variables on Render**:
   Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, and `EMAIL_DRY_RUN` in the Render dashboard environment settings.
4. **Static Assets**:
   FastAPI automatically serves `frontend/dist` when it exists, meaning no separate web server is required.

---

## Security Best Practices

- **Zero Credentials in Git**: All sensitive credentials (SMTP passwords, app passwords, secret keys) are exclusively sourced through environment variables.
- **Participant Privacy**: Real participant datasets and generated certificates are excluded from the repository via `.gitignore`.
- **Sanitized Uploads**: All recipient names and file inputs are sanitized against directory traversal and script injection.

---

## License & Credits

Developed for **TechByte Summit ’26**  
Department of Computer Science and Engineering  
KPR Institute of Engineering and Technology, Coimbatore
