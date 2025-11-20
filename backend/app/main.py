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

from backend.app.statistics import calculate_player_summary

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

@app.put("/user/update")
def update_user_profile(
    data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")

        current_user = (
            supabase.table("users").select("*").eq("username", username).single().execute()
        ).data

        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")

        new_username = data.get("username")
        new_email = data.get("email")

        if not new_username and not new_email:
            raise HTTPException(status_code=400, detail="No fields provided to update")

        updates = {}

        if new_username and new_username != current_user["username"]:
            existing_username = (
                supabase.table("users")
                .select("id")
                .eq("username", new_username)
                .execute()
            )
            if existing_username.data:
                raise HTTPException(status_code=400, detail="Username already exists")
            updates["username"] = new_username

        if new_email and new_email != current_user["email"]:
            existing_email = (
                supabase.table("users").select("id").eq("email", new_email).execute()
            )
            if existing_email.data:
                raise HTTPException(status_code=400, detail="Email already exists")
            updates["email"] = new_email

        if not updates:
            raise HTTPException(status_code=400, detail="No valid changes detected")

        result = (
            supabase.table("users")
            .update(updates)
            .eq("username", username)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update user")

        updated_user = result.data[0]
        print("User profile updated successfully:", updated_user)

        new_token = None
        if "username" in updates:
            new_token = create_access_token({"sub": updates["username"]})

        response = {"message": "Profile updated successfully", "user": updated_user}
        if new_token:
            response["token"] = new_token

        return response

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        print("UPDATE USER PROFILE ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/teams_statistics")
def get_teams_stats(data: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    # assists, turnovers, team score (ovo su poeni), field goals percentage, three pointers percentage, 
    # free throws percentage, rebounds_total, q1_points, q2_points, q3_points, q4_points
    try:
        first_team_id = 1610612742
        second_team_id = 1610612762

        last_n_games = 20
        category = "team_score"
        # fetch stats for first team
        first_team_stats_response = supabase.table("team_statistics") \
            .select(f"game_date, teamId, {category}", count="exact") \
            .eq("teamId", first_team_id) \
            .eq("opponent_team_id", second_team_id) \
            .order("game_date", desc=True) \
            .limit(last_n_games)  \
            .execute()
        
        first_team_name = supabase.table("teams") \
            .select("full_name") \
            .eq("id", first_team_id) \
            .execute()


        # stats for second team
        second_team_stats_response = supabase.table("team_statistics") \
            .select(f"game_date, teamId, {category}", count="exact") \
            .eq("teamId", second_team_id) \
            .eq("opponent_team_id", first_team_id) \
            .order("game_date", desc=True) \
            .limit(last_n_games)  \
            .execute()

        second_team_name = supabase.table("teams") \
            .select("full_name") \
            .eq("id", second_team_id) \
            .execute()

        first_team_games = first_team_stats_response.data[::-1]  # reverse list so oldest first
        for i, row in enumerate(first_team_games, start=1):
            row["game_order"] = i
            del row["game_date"]
            del row["teamId"]  

        second_team_games = second_team_stats_response.data[::-1]
        for i, row in enumerate(second_team_games, start=1):
            row["game_order"] = i
            del row["game_date"]
            del row["teamId"]  

        response = {
            "first_team": {
                "id": first_team_id,
                "name": first_team_name,
                "stats": first_team_games
            },
            "second_team": {
                "id": second_team_id,
                "name": second_team_name,
                "stats": second_team_games
            }
        }
        return response

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/player_statistics")
def get_players_stats(data: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    try: 
        first_player_id = 2544
        second_player_id = 202681
        start_date = "2024-01-01"
        end_date = "2024-12-31"

        categories = "points, assists, rebounds_total, field_goals_attempted, field_goals_made, three_pointers_attempted," \
                    "three_pointers_made, free_throws_attempted, free_throws_made"
        
        # fetch stats for first player
        first_player_stats = (
            supabase.table("player_statistics")
            .select(f"player_id, player_team_name, game_date, {categories}") \
            .eq("player_id", first_player_id) \
            .gte("game_date", start_date) \
            .lte("game_date", end_date) \
            .order("game_date", desc=True) \
            .execute()
        ).data

        # Fetch stats for second player
        second_player_stats = (
            supabase.table("player_statistics")
            .select(f"player_id, player_team_name, game_date, {categories}") \
            .eq("player_id", second_player_id) \
            .gte("game_date", start_date) \
            .lte("game_date", end_date) \
            .order("game_date", desc=True) \
            .execute()
        ).data

        # Optional: print results
        first_player_stats = calculate_player_summary(first_player_stats)
        second_player_stats = calculate_player_summary(second_player_stats)
        
        response = {
            "first_player": {
                "id": first_player_id,
                "stats": first_player_stats
            },
            "second_player": {
                "id": second_player_id,
                "stats": second_player_stats
            }
        }
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/get_clutch_factor")
def get_clutch_factor_stats(data: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    pass