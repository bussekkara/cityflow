from fastapi import FastAPI
from backend.app.api.work_orders import router as work_orders_router
from backend.app.api.departments import router as departments_router
from backend.app.api.requests import router as requests_router
from backend.app.api.request_status_history import router as status_history_router
from backend.app.api.users import router as users_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="CityFlow API",
    description="Municipal Service Request & Work Order Management System",
    version="0.1.0"
)
app.add_middleware(
    CORSMiddleware,
 allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(departments_router)
app.include_router(requests_router)
app.include_router(work_orders_router)
app.include_router(status_history_router)
app.include_router(users_router)


@app.get("/")
def root():
    return {
        "message": "CityFlow API çalışıyor!",
        "version": "0.1.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
