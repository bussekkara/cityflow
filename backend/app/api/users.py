from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
from pydantic import BaseModel, EmailStr

from database.connection import get_db
from backend.app.models.user import User
from backend.app.schemas.user import (
    UserCreate,
    CitizenRegister,
    UserLogin,
    UserResponse
)
from backend.app.auth import (
    create_access_token,
    get_current_user,
    require_roles
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


password_hash = PasswordHash.recommended()


# =========================================================
# UPDATE USER SCHEMA
# =========================================================

class UserUpdate(BaseModel):
    full_name: str
    email: EmailStr
    role: str
    department_id: int | None = None
    password: str | None = None


# =========================================================
# GET ALL USERS
# ADMIN + MANAGER
# =========================================================

@router.get("/", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "manager")
    )
):
    return db.query(User).all()


# =========================================================
# CREATE USER
# ADMIN ONLY
# =========================================================

@router.post("/", response_model=UserResponse)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    )
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Bu email adresi zaten kayıtlı"
        )

    hashed_password = password_hash.hash(
        user.password
    )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        department_id=user.department_id,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# =========================================================
# CITIZEN REGISTER
# =========================================================

@router.post("/register", response_model=UserResponse)
def register_citizen(
    user: CitizenRegister,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Bu email adresi zaten kayıtlı"
        )

    hashed_password = password_hash.hash(
        user.password
    )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        role="citizen",
        department_id=None,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email veya şifre hatalı"
        )

    if not password_hash.verify(
        user_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Email veya şifre hatalı"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Kullanıcı hesabı aktif değil"
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role
        }
    )

    return {
        "message": "Giriş başarılı",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "department_id": user.department_id
    }


# =========================================================
# GET CURRENT USER
# =========================================================

@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


# =========================================================
# GET USER BY ID
# ADMIN + MANAGER
# =========================================================

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "manager")
    )
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Kullanıcı bulunamadı"
        )

    return user


# =========================================================
# UPDATE USER
# ADMIN ONLY
# =========================================================

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    )
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Kullanıcı bulunamadı"
        )

    existing_user = db.query(User).filter(
        User.email == user_data.email,
        User.id != user_id
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Bu email adresi başka bir kullanıcı tarafından kullanılıyor"
        )

    user.full_name = user_data.full_name
    user.email = user_data.email
    user.role = user_data.role
    user.department_id = user_data.department_id

    # Şifre gönderildiyse değiştir
    if user_data.password:
        user.password_hash = password_hash.hash(
            user_data.password
        )

    db.commit()
    db.refresh(user)

    return user


# =========================================================
# TOGGLE USER ACTIVE / PASSIVE
# ADMIN ONLY
# =========================================================

@router.put("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    )
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Kullanıcı bulunamadı"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Kendi hesabınızı pasif yapamazsınız"
        )

    user.is_active = not user.is_active

    db.commit()
    db.refresh(user)

    return user


# =========================================================
# DELETE USER
# ADMIN ONLY
# =========================================================

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    )
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Kullanıcı bulunamadı"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Kendi hesabınızı silemezsiniz"
        )

    db.delete(user)
    db.commit()

    return {
        "message": "Kullanıcı başarıyla silindi",
        "id": user_id
    }