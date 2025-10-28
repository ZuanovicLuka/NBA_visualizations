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
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

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

security = HTTPBearer()
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
    favourite_team_name: str | None = None
    favourite_player_name: str | None = None


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

@app.put("/setup-team-and-player")
def update_profile(
    data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")

        favourite_team = data.get("favourite_team_name")
        favourite_player = data.get("favourite_player_name")
        favourite_player_id = data.get("favourite_player_id")

        if not favourite_team and not favourite_player and not favourite_player_id:
            raise HTTPException(status_code=400, detail="No fields provided to update")

        updates = {}
        if favourite_team:
            updates["favourite_team_name"] = favourite_team
        if favourite_player:
            updates["favourite_player_name"] = favourite_player
        if favourite_player_id:
            updates["favourite_player_id"] = favourite_player_id

        result = (
            supabase.table("users")
            .update(updates)
            .eq("username", username)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")

        print("Profile updated successfully:", result.data[0])
        return {"message": "Profile updated successfully", "user": result.data[0]}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print("UPDATE PROFILE ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

    
@app.get("/teams")
def get_teams(search: str = ""):
    """Search teams by full_name"""
    try:
        print(f"Searching teams for query: '{search}'")
        query = supabase.table("teams").select("id, full_name, logo_url")
        if search:
            query = query.ilike("full_name", f"%{search}%")
        response = query.execute()

        return response.data or []
    except Exception as e:
        print("TEAMS SEARCH ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/players")
def get_players(search: str = ""):
    """Search players by first or last name and attach image URLs"""
    try:
        print(f"Searching players for query: '{search}'")
        query = supabase.table("active_players").select(
            "player_id, first_name, last_name, jersey"
        )
        if search:
            query = query.or_(
                f"first_name.ilike.%{search}%,last_name.ilike.%{search}%"
            )
        response = query.execute()
        players = response.data or []

        for p in players:
            image_path = f"{p['player_id']}.png"
            try:
                image_url = supabase.storage.from_("Player images").get_public_url(image_path)
                p["image_url"] = image_url
            except Exception:
                p["image_url"] = "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"

            p["name"] = f"{p['first_name']} {p['last_name']}"
        return players

    except Exception as e:
        print("PLAYER SEARCH ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/player-image")
def get_player_image(name: str):
    """Get a player's image URL by full name."""
    try:
        if not name:
            raise HTTPException(status_code=400, detail="Player name is required")

        print(f"Searching image for player: '{name}'")

        parts = name.strip().split(" ")
        query = supabase.table("active_players").select("player_id, first_name, last_name")

        if len(parts) == 2:
            first, last = parts
            query = query.or_(
                f"first_name.ilike.%{first}%,last_name.ilike.%{last}%"
            )
        else:
            query = query.or_(
                f"first_name.ilike.%{name}%,last_name.ilike.%{name}%"
            )

        response = query.execute()
        players = response.data or []

        if not players:
            print("No matching player found for:", name)
            return {"image_url": "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"}

        player = next(
            (p for p in players if f"{p['first_name']} {p['last_name']}".strip().lower() == name.lower()),
            players[0]
        )

        player_id = player["player_id"]
        image_path = f"{player_id}.png"

        try:
            image_url = supabase.storage.from_("Player images").get_public_url(image_path)
            print("Found image for player:", player_id, image_url)
        except Exception:
            image_url = "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"

        return {"image_url": image_url, "player_id": player_id}

    except Exception as e:
        print("GET PLAYER IMAGE ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.get("/check-if-setup-completed")
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")

        response = (
            supabase.table("users")
            .select("*")
            .eq("username", username)
            .execute()
        )

        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return response.data[0]

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.get("/users/info")
def get_user_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        response = (
            supabase.table("users")
            .select("*")
            .eq("username", username)
            .single()
            .execute()
        )

        return response.data
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

