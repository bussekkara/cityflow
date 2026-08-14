from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database.connection import get_db
from backend.app.models.work_order import WorkOrder
from backend.app.models.user import User
from backend.app.models.request_status_history import RequestStatusHistory
from backend.app.schemas.work_order import (
    WorkOrderCreate,
    WorkOrderStatusUpdate
)
from backend.app.auth import get_current_user, require_roles


router = APIRouter(
    prefix="/work-orders",
    tags=["Work Orders"]
)


# =========================================================
# CREATE WORK ORDER
# ADMIN + MANAGER
# =========================================================

@router.post("/")
def create_work_order(
    work_order: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "manager")
    )
):
    # Atanacak kullanıcı varsa kontrol et
    if work_order.assigned_to is not None:

        assigned_user = db.query(User).filter(
            User.id == work_order.assigned_to
        ).first()

        if not assigned_user:
            raise HTTPException(
                status_code=404,
                detail="Atanacak kullanıcı bulunamadı"
            )

        # Sadece employee atanabilir
        if assigned_user.role != "employee":
            raise HTTPException(
                status_code=400,
                detail="İş emri sadece employee kullanıcılara atanabilir"
            )

    new_work_order = WorkOrder(
        request_id=work_order.request_id,
        assigned_to=work_order.assigned_to,
        notes=work_order.notes,
        status="assigned"
    )

    db.add(new_work_order)
    db.commit()
    db.refresh(new_work_order)

    return new_work_order


# =========================================================
# GET ALL WORK ORDERS
# ADMIN + MANAGER
# =========================================================

@router.get("/")
def get_work_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "manager")
    )
):
    return db.query(WorkOrder).all()


# =========================================================
# GET MY WORK ORDERS
# EMPLOYEE
#
# ÖNEMLİ:
# Bu endpoint /{work_order_id} endpointinden ÖNCE
# gelmeli. Yoksa /my, work_order_id olarak algılanabilir.
# =========================================================

@router.get("/my")
def get_my_work_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("employee")
    )
):
    return db.query(WorkOrder).filter(
        WorkOrder.assigned_to == current_user.id
    ).all()


# =========================================================
# GET WORK ORDER BY ID
# ADMIN + MANAGER
# =========================================================

@router.get("/{work_order_id}")
def get_work_order(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "manager")
    )
):
    work_order = db.query(WorkOrder).filter(
        WorkOrder.id == work_order_id
    ).first()

    if not work_order:
        raise HTTPException(
            status_code=404,
            detail="İş emri bulunamadı"
        )

    return work_order


# =========================================================
# ASSIGN WORK ORDER
# ADMIN + MANAGER
# =========================================================

@router.put("/{work_order_id}/assign")
def assign_work_order(
    work_order_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "manager")
    )
):
    work_order = db.query(WorkOrder).filter(
        WorkOrder.id == work_order_id
    ).first()

    if not work_order:
        raise HTTPException(
            status_code=404,
            detail="İş emri bulunamadı"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Kullanıcı bulunamadı"
        )

    # Sadece employee atanabilir
    if user.role != "employee":
        raise HTTPException(
            status_code=400,
            detail="İş emri sadece employee kullanıcılara atanabilir"
        )

    work_order.assigned_to = user.id
    work_order.status = "assigned"

    db.commit()
    db.refresh(work_order)

    return work_order


# =========================================================
# UPDATE WORK ORDER STATUS
# ADMIN + MANAGER + EMPLOYEE
# =========================================================

@router.put("/{work_order_id}/status")
def update_work_order_status(
    work_order_id: int,
    status_update: WorkOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    work_order = db.query(WorkOrder).filter(
        WorkOrder.id == work_order_id
    ).first()

    if not work_order:
        raise HTTPException(
            status_code=404,
            detail="İş emri bulunamadı"
        )

    # Citizen iş emri güncelleyemez
    if current_user.role == "citizen":
        raise HTTPException(
            status_code=403,
            detail="Bu işlem için yetkiniz yok"
        )

    # Employee sadece kendisine atanmış
    # iş emrinin durumunu değiştirebilir
    if current_user.role == "employee":

        if work_order.assigned_to != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Bu iş emrini güncelleme yetkiniz yok"
            )

    old_status = work_order.status
    new_status = status_update.status

    # Aynı durumdaysa history oluşturma
    if old_status == new_status:
        return work_order

    work_order.status = new_status

    # =====================================================
    # IN PROGRESS
    # =====================================================

    if new_status == "in_progress":

        if work_order.started_at is None:
            work_order.started_at = datetime.utcnow()

        work_order.completed_at = None

    # =====================================================
    # COMPLETED
    # =====================================================

    elif new_status == "completed":

        if work_order.started_at is None:
            work_order.started_at = datetime.utcnow()

        work_order.completed_at = datetime.utcnow()

    # =====================================================
    # STATUS HISTORY
    # =====================================================

    history = RequestStatusHistory(
        request_id=work_order.request_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=current_user.id,
        note=f"Work Order #{work_order.id} durumu güncellendi."
    )

    db.add(history)

    db.commit()
    db.refresh(work_order)

    return work_order