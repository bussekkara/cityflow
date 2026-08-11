from fastapi import FastAPI

app = FastAPI(
    title="CityFlow API",
    description="Municipal Service Request & Work Order Management System",
    version="0.1.0"
)


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