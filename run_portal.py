"""
TECHBYTE CERTIFICATE PORTAL
Techbyte Summit '26 – Participation Certificate Automation
Startup Launcher
"""

import sys
import os
import uvicorn
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "backend"))

if __name__ == "__main__":
    print("=" * 65)
    print("TECHBYTE CERTIFICATE PORTAL - TECHBYTE SUMMIT '26")
    print("Department of Computer Science and Engineering")
    print("KPR Institute of Engineering and Technology")
    print("=" * 65)
    print("Starting server at: http://127.0.0.1:8000")
    print("Press Ctrl+C to terminate.")
    print("=" * 65)
    
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=False
    )
