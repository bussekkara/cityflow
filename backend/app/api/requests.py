from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from backend.app.models import ServiceRequest, User
from backend.app.schemas.request import ServiceRequestCreate
from backend.app.auth import require_roles


router = APIRouter(
    prefix="/requests",
    tags=["Requests"]
)


# -------------------------
# GET ALL REQUESTS
# ADMIN + MANAGER + EMPLOYEE
# -------------------------

@router.get("/")
def get_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "manager", "employee")
    )
):
    return db.query(ServiceRequest).all()


# -------------------------
# GET MY REQUESTS
# CITIZEN
# -------------------------

@router.get("/my")
def get_my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("citizen")
    )
):
    return db.query(ServiceRequest).filter(
        ServiceRequest.created_by == current_user.id
    ).all()


# -------------------------
# GET REQUEST BY ID
# ADMIN + MANAGER + EMPLOYEE
# -------------------------

@router.get("/{request_id}")
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "manager", "employee")
    )
):
    request = db.query(ServiceRequest).filter(
        ServiceRequest.id == request_id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Talep bulunamadı"
        )

    return request


# -------------------------
# CREATE REQUEST
# ALL AUTHENTICATED USERS
# -------------------------

@router.post("/")
def create_request(
    request: ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "manager", "employee", "citizen")
    )
):
    new_request = ServiceRequest(
        title=request.title,
        description=request.description,
        category_id=request.category_id,
        citizen_name=request.citizen_name,
        citizen_email=request.citizen_email,
        address=request.address,
        latitude=request.latitude,
        longitude=request.longitude,
        priority=request.priority,
        status="submitted",
        created_by=current_user.id
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request


# -------------------------
# UPDATE REQUEST
# ADMIN + MANAGER
# -------------------------

@router.put("/{request_id}")
def update_request(
    request_id: int,
    request: ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "manager")
    )
):
    existing_request = db.query(ServiceRequest).filter(
        ServiceRequest.id == request_id
    ).first()

    if not existing_request:
        raise HTTPException(
            status_code=404,
            detail="Talep bulunamadı"
        )

    existing_request.title = request.title
    existing_request.description = request.description
    existing_request.category_id = request.category_id
    existing_request.citizen_name = request.citizen_name
    existing_request.citizen_email = request.citizen_email
    existing_request.address = request.address
    existing_request.latitude = request.latitude
    existing_request.longitude = request.longitude
    existing_request.priority = request.priority

    db.commit()
    db.refresh(existing_request)

    return existing_request


# -------------------------
# DELETE REQUEST
# ADMIN ONLY
# -------------------------

@router.delete("/{request_id}")
def delete_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    )
):
    request = db.query(ServiceRequest).filter(
        ServiceRequest.id == request_id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Talep bulunamadı"
        )

    db.delete(request)
    db.commit()

    return {
        "message": "Talep başarıyla silindi",
        "id": request_id
    }