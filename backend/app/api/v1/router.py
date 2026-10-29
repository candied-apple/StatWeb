from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.projects import router as projects_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.variables import router as variables_router
from app.api.v1.analyses import router as analyses_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(projects_router)
api_v1_router.include_router(datasets_router)
api_v1_router.include_router(variables_router)
api_v1_router.include_router(analyses_router)
