from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from werkzeug.security import generate_password_hash, check_password_hash
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import UserRegister, UserResponse, UserUpdate, PasswordChange, Token
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

class LoginRequest(BaseModel):
    email: str
    password: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

async def get_optional_user(
    token: str | None = Depends(oauth2_scheme_optional),
    db: AsyncSession = Depends(get_db),
):
    if not token:
        return None
    try:
        return await get_current_user(token=token, db=db)
    except HTTPException:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == user_data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = generate_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        created_at=new_user.created_at
    )

@router.post("/token", response_model=Token)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not check_password_hash(user.hashed_password, login_data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})
    return Token(access_token=access_token)

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        created_at=current_user.created_at
    )

@router.patch("/me", response_model=UserResponse)
async def update_users_me(
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_data.email and user_data.email != current_user.email:
        existing = await db.execute(
            select(User).where(User.email == user_data.email, User.id != current_user.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_data.email

    if user_data.name is not None:
        name = user_data.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        current_user.name = name

    await db.commit()
    await db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        created_at=current_user.created_at,
    )

@router.post("/password")
async def change_password(
    data: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not check_password_hash(current_user.hashed_password, data.current_password):
        raise HTTPException(status_code=400, detail="Invalid current password")

    current_user.hashed_password = generate_password_hash(data.new_password)
    await db.commit()
    return {"message": "Password updated"}