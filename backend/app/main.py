import os
import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials not found in environment variables!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY not set!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

app = FastAPI()

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

@app.get("/")
def read_root():
    return {"message": "Backend connected to Supabase successfully!"}

@app.post("/register")
def register_user(user: UserCreate):
    try:
        print(f"Checking if user '{user.username}' or email '{user.email}' exists...")

        existing = (
            supabase.table("users")
            .select("*")
            .or_(f"username.eq.{user.username},email.eq.{user.email}")
            .execute()
        )

        if existing.data and len(existing.data) > 0:
            print("Existing user found:", existing.data)
            if existing.data[0]["username"] == user.username:
                raise HTTPException(status_code=400, detail="Username already exists")
            if existing.data[0]["email"] == user.email:
                raise HTTPException(status_code=400, detail="Email already exists")

        pw_bytes = user.password.encode("utf-8")[:72]
        hashed_pw = bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")

        result = (
            supabase.table("users")
            .insert(
                {
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "username": user.username,
                    "email": user.email,
                    "hashed_password": hashed_pw,
                }
            )
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to insert user")

        new_user = result.data[0]
        print("User created successfully:", new_user)

        token = create_access_token({"sub": new_user["username"]})
        print("JWT Token created for:", new_user["username"])

        return {"token": token, "user": new_user}

    except HTTPException:
        raise
    except Exception as e:
        print("REGISTER ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.post("/login")
def login(user: UserLogin):
    try:
        print(f"Searching for user '{user.username}'...")

        response = (
            supabase.table("users")
            .select("*")
            .eq("username", user.username)
            .execute()
        )

        if not response.data or len(response.data) == 0:
            print("No user found.")
            raise HTTPException(status_code=400, detail="Invalid username or password")

        db_user = response.data[0]

        pw_bytes = user.password.encode("utf-8")[:72]

        if not bcrypt.checkpw(pw_bytes, db_user["hashed_password"].encode("utf-8")):
            print("Password mismatch for:", db_user["username"])
            raise HTTPException(status_code=400, detail="Invalid username or password")

        token = create_access_token({"sub": db_user["username"]})
        print("Login successful for:", db_user["username"])

        user_data = {
            "id": db_user["id"],
            "username": db_user["username"],
            "email": db_user["email"],
            "first_name": db_user["first_name"],
            "last_name": db_user["last_name"],
        }

        return {"token": token, "user": user_data}

    except HTTPException:
        raise
    except Exception as e:
        print("LOGIN ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
