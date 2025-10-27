import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import os
from supabase import create_client, Client

load_dotenv()

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable not set!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

DATABASE_URL = "sqlite:///./database.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

app = FastAPI()
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    username = Column(String, unique=True)
    email = Column(String, unique=True)
    hashed_password = Column(String)

Base.metadata.create_all(bind=engine)

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    username: str
    password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Backend is working!"}

@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    errors = []
    if db.query(User).filter(User.username == user.username).first():
        errors.append("Username already exists")
    if db.query(User).filter(User.email == user.email).first():
        errors.append("Email already exists")
    if errors:
        raise HTTPException(status_code=400, detail=errors)

    pw_bytes = user.password.encode('utf-8')[:72]
    hashed_pw = bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")

    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.username})

    return {"token": token, "user": new_user}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid username or password")

    pw_bytes = user.password.encode("utf-8")[:72]
    if not bcrypt.checkpw(pw_bytes, db_user.hashed_password.encode("utf-8")):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    token = create_access_token({"sub": db_user.username})

    return {"token": token, "user": db_user}

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    logo_url = Column(String, nullable=False)

Base.metadata.create_all(bind=engine)

class TeamResponse(BaseModel):
    id: int
    name: str
    logo_url: str

    class Config:
        orm_mode = True

@app.post("/seed-teams")
def seed_teams(db: Session = Depends(get_db)):
    teams_data = [
        {"name": "Atlanta Hawks", "logo_url": "https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg"},
        {"name": "Boston Celtics", "logo_url": "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg"},
        {"name": "Brooklyn Nets", "logo_url": "https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg"},
        {"name": "Charlotte Hornets", "logo_url": "https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg"},
        {"name": "Chicago Bulls", "logo_url": "https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg"},
        {"name": "Cleveland Cavaliers", "logo_url": "https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg"},
        {"name": "Dallas Mavericks", "logo_url": "https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg"},
        {"name": "Denver Nuggets", "logo_url": "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg"},
        {"name": "Detroit Pistons", "logo_url": "https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg"},
        {"name": "Golden State Warriors", "logo_url": "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg"},
        {"name": "Houston Rockets", "logo_url": "https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg"},
        {"name": "Indiana Pacers", "logo_url": "https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg"},
        {"name": "LA Clippers", "logo_url": "https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg"},
        {"name": "Los Angeles Lakers", "logo_url": "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg"},
        {"name": "Memphis Grizzlies", "logo_url": "https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg"},
        {"name": "Miami Heat", "logo_url": "https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg"},
        {"name": "Milwaukee Bucks", "logo_url": "https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg"},
        {"name": "Minnesota Timberwolves", "logo_url": "https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg"},
        {"name": "New Orleans Pelicans", "logo_url": "https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg"},
        {"name": "New York Knicks", "logo_url": "https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg"},
        {"name": "Oklahoma City Thunder", "logo_url": "https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg"},
        {"name": "Orlando Magic", "logo_url": "https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg"},
        {"name": "Philadelphia 76ers", "logo_url": "https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg"},
        {"name": "Phoenix Suns", "logo_url": "https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg"},
        {"name": "Portland Trail Blazers", "logo_url": "https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg"},
        {"name": "Sacramento Kings", "logo_url": "https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg"},
        {"name": "San Antonio Spurs", "logo_url": "https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg"},
        {"name": "Toronto Raptors", "logo_url": "https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg"},
        {"name": "Utah Jazz", "logo_url": "https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg"},
        {"name": "Washington Wizards", "logo_url": "https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg"},
    ]

    for team in teams_data:
        if not db.query(Team).filter(Team.name == team["name"]).first():
            db.add(Team(**team))
    db.commit()
    return {"message": "Teams seeded successfully!"}


@app.get("/teams", response_model=list[TeamResponse])
def get_teams(search: str = None, db: Session = Depends(get_db)):
    query = db.query(Team)
    if search:
        query = query.filter(Team.name.ilike(f"%{search}%"))
    return query.order_by(Team.name).all()

# --- NBA Players Model ---
class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    team_id = Column(Integer)  # optional: link to Team
    position = Column(String, nullable=True)  # optional
    number = Column(Integer, nullable=True)  # optional

Base.metadata.create_all(bind=engine)

class PlayerResponse(BaseModel):
    id: int
    name: str
    team_id: int | None = None
    position: str | None = None
    number: int | None = None

    class Config:
        orm_mode = True

# --- Seed players route (optional, only run once) ---
@app.post("/seed-players")
def seed_players(db: Session = Depends(get_db)):
    players_data = [
        {"name": "LeBron James", "team_id": 14, "position": "SF", "number": 6},
        {"name": "Stephen Curry", "team_id": 10, "position": "PG", "number": 30},
        # ... add all 522 players here
    ]

    for player in players_data:
        if not db.query(Player).filter(Player.name == player["name"]).first():
            db.add(Player(**player))
    db.commit()
    return {"message": "Players seeded successfully!"}

@app.get("/players", response_model=list[PlayerResponse])
def get_players(search: str = None, db: Session = Depends(get_db)):
    query = db.query(Player)
    if search:
        query = query.filter(Player.name.ilike(f"%{search}%"))
    return query.order_by(Player.name).all()
