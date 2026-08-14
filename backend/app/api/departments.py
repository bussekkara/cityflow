from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.connection import get_db
from backend.app.models import Department, User
from backend.app.auth import require_roles


router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)


# =========================================
# SCHEMAS
# =========================================

class DepartmentCreate(BaseModel):
    name: str
    description: str | None = None


class DepartmentUpdate(BaseModel):
    name: str
    description: str | None = None


# =========================================
# GET ALL DEPARTMENTS
# ADMIN + MANAGER + EMPLOYEE
# =========================================

@router.get("/")
def get_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "manager",
            "employee"
        )
    )
):
    return db.query(Department).all()


# =========================================
# GET DEPARTMENT BY ID
# ADMIN + MANAGER + EMPLOYEE
# =========================================

@router.get("/{department_id}")
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "manager",
            "employee"
        )
    )
):
    department = (
        db.query(Department)
        .filter(
            Department.id == department_id
        )
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Departman bulunamadı"
        )

    return department


# =========================================
# CREATE DEPARTMENT
# ADMIN + MANAGER
# =========================================

@router.post("/")
def create_department(
    department_data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "manager"
        )
    )
):
    existing_department = (
        db.query(Department)
        .filter(
            Department.name ==
            department_data.name
        )
        .first()
    )

    if existing_department:
        raise HTTPException(
            status_code=400,
            detail="Bu departman zaten mevcut"
        )

    new_department = Department(
        name=department_data.name,
        description=department_data.description
    )

    db.add(new_department)
    db.commit()
    db.refresh(new_department)

    return new_department


# =========================================
# UPDATE DEPARTMENT
# ADMIN + MANAGER
# =========================================

@router.put("/{department_id}")
def update_department(
    department_id: int,
    department_data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "manager"
        )
    )
):
    department = (
        db.query(Department)
        .filter(
            Department.id == department_id
        )
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Departman bulunamadı"
        )

    duplicate_department = (
        db.query(Department)
        .filter(
            Department.name ==
            department_data.name,
            Department.id != department_id
        )
        .first()
    )

    if duplicate_department:
        raise HTTPException(
            status_code=400,
            detail="Bu isimde başka bir departman zaten mevcut"
        )

    department.name = (
        department_data.name
    )

    department.description = (
        department_data.description
    )

    db.commit()
    db.refresh(department)

    return department


# =========================================
# DELETE DEPARTMENT
# ADMIN ONLY
# =========================================

@router.delete("/{department_id}")
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    )
):
    department = (
        db.query(Department)
        .filter(
            Department.id == department_id
        )
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Departman bulunamadı"
        )

    db.delete(department)
    db.commit()

    return {
        "message": "Departman başarıyla silindi",
        "id": department_id
    }