from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config.settings import APP_TITLE, APP_VERSION, GENERATED_DIR, TEMPLATES_DIR, BASE_DIR
from app.config.events import validate_all_templates
from app.routes.events import router as events_router
from app.routes.upload import router as upload_router
from app.routes.certificates import router as certificates_router
from app.routes.email import router as email_router

app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description="Automated Participation Certificate Generation and Delivery Portal for TECHBYTE SUMMIT '26"
)

@app.on_event("startup")
def startup_event():
    try:
        validate_all_templates()
    except Exception as e:
        print(f"ERROR validating certificate templates on startup: {e}")
        raise

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(events_router)
app.include_router(upload_router)
app.include_router(certificates_router)
app.include_router(email_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": APP_TITLE,
        "version": APP_VERSION
    }

# SPA Static Serving for production build
FRONTEND_DIST = (BASE_DIR / "frontend" / "dist").resolve()
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="spa_assets")

    @app.get("/")
    def serve_index():
        return FileResponse(str(FRONTEND_DIST / "index.html"))

    @app.get("/{full_path:path}")
    def serve_spa_fallback(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Endpoint not found")
        try:
            candidate = (FRONTEND_DIST / full_path).resolve()
            # Guard against path traversal: must stay within FRONTEND_DIST
            if candidate.is_file() and str(candidate).startswith(str(FRONTEND_DIST)):
                return FileResponse(str(candidate))
        except Exception:
            pass
        return FileResponse(str(FRONTEND_DIST / "index.html"))
