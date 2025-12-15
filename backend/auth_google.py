# backend/auth_google.py
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()
CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")  # set this in backend/.env

app = FastAPI()

class TokenIn(BaseModel):
    id_token: str

def get_db():
    conn = sqlite3.connect("backend.db")
    return conn

@app.get("/")
def root():
    return {"ok": True, "msg": "Auth server running"}

@app.post("/auth/google")
def auth_google(t: TokenIn, response: Response):
    try:
        # Verify token (throws ValueError if invalid)
        idinfo = id_token.verify_oauth2_token(t.id_token, grequests.Request(), CLIENT_ID)

        # idinfo contains fields like 'sub' (google id), 'email', 'name', 'picture'
        google_sub = idinfo["sub"]
        email = idinfo.get("email")
        name = idinfo.get("name")

        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_sub TEXT UNIQUE,
            email TEXT,
            name TEXT
          )""")
        cur.execute("SELECT id FROM users WHERE google_sub = ?", (google_sub,))
        row = cur.fetchone()
        if row:
            user_id = row[0]
            cur.execute("UPDATE users SET email=?, name=? WHERE id=?", (email, name, user_id))
        else:
            cur.execute("INSERT INTO users (google_sub,email,name) VALUES (?,?,?)", (google_sub,email,name))
            user_id = cur.lastrowid
        conn.commit()
        conn.close()

        # Set a simple session cookie (demo only). In production, use secure, signed session.
        response.set_cookie(key="session_user", value=str(user_id), httponly=True, samesite="lax")
        return {"ok": True, "user": {"id": user_id, "email": email, "name": name}}
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid ID token")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:5173"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)
