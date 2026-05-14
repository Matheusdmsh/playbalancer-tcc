from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from bson import ObjectId
import psutil
import os

from app.core.config import get_db
from app.core.security import get_current_user

router = APIRouter(prefix="/system", tags=["Creators Dashboard"])

def verify_creator(user: dict):
    if "rachinha" not in user.get("role", []):
        raise HTTPException(status_code=403, detail="Acesso restrito. Role 'rachinha' necessária.")

@router.get("/overview")
async def get_overview(db=Depends(get_db), user=Depends(get_current_user)):
    verify_creator(user)
    
    now = datetime.utcnow()
    one_day_ago = now - timedelta(days=1)
    one_week_ago = now - timedelta(weeks=1)
    one_month_ago = now - timedelta(days=30)
    
    users_coll = db["users"]
    
    # Usuários Ativos
    daily_active = await users_coll.count_documents({"last_login": {"$gte": one_day_ago}})
    weekly_active = await users_coll.count_documents({"last_login": {"$gte": one_week_ago}})
    monthly_active = await users_coll.count_documents({"last_login": {"$gte": one_month_ago}})
    
    # Novos usuários
    new_users_daily = await users_coll.count_documents({"created_at": {"$gte": one_day_ago}})
    new_users_weekly = await users_coll.count_documents({"created_at": {"$gte": one_week_ago}})
    new_users_monthly = await users_coll.count_documents({"created_at": {"$gte": one_month_ago}})
    
    # Últimos acessos (últimos 10 usuários que logaram)
    last_accesses_cursor = users_coll.find({"is_placeholder": {"$ne": True}}).sort("last_login", -1).limit(10)
    last_accesses = []
    async for u in last_accesses_cursor:
        last_accesses.append({
            "id": str(u["_id"]),
            "name": u.get("name"),
            "username": u.get("username"),
            "last_login": u.get("last_login")
        })
        
    return {
        "active_users": {
            "daily": daily_active,
            "weekly": weekly_active,
            "monthly": monthly_active
        },
        "new_users": {
            "daily": new_users_daily,
            "weekly": new_users_weekly,
            "monthly": new_users_monthly
        },
        "last_accesses": last_accesses
    }

@router.get("/users")
async def get_users_metrics(db=Depends(get_db), user=Depends(get_current_user)):
    verify_creator(user)
    users_coll = db["users"]
    
    cursor = users_coll.find({"is_placeholder": {"$ne": True}}).sort("created_at", -1)
    real_users = []
    async for u in cursor:
        real_users.append({
            "id": str(u["_id"]),
            "photo_url": u.get("photo_url"),
            "roles": u.get("role", []),
            "username": u.get("username"),
            "email": u.get("email"),
            "created_at": u.get("created_at"),
            "last_login": u.get("last_login")
        })
        
    return {"users": real_users}

@router.put("/users/{user_id}/role")
async def update_user_roles(user_id: str, payload: dict, db=Depends(get_db), user=Depends(get_current_user)):
    verify_creator(user)
    roles = payload.get("roles", [])
    result = await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": roles}}
    )
    if result.modified_count == 0:
         raise HTTPException(status_code=404, detail="Usuário não encontrado ou role já configurada.")
    return {"detail": "Roles atualizadas com sucesso"}

@router.get("/content")
async def get_content_metrics(db=Depends(get_db), user=Depends(get_current_user)):
    verify_creator(user)
    
    groups_count = await db["groups"].count_documents({})
    courts_count = await db["courts"].count_documents({})
    arenas_count = await db["arenas"].count_documents({})
    transactions_count = await db["transactions"].count_documents({})
    bookings_count = await db["bookings"].count_documents({})
    
    # Regiões das arenas
    pipeline = [
        {"$group": {"_id": "$location.city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    city_counts = []
    async for doc in db["arenas"].aggregate(pipeline):
        city = doc["_id"] if doc["_id"] else "Não Especificado"
        city_counts.append({"city": city, "count": doc["count"]})
        
    return {
        "totals": {
            "groups": groups_count,
            "courts": courts_count,
            "arenas": arenas_count,
            "transactions": transactions_count,
            "bookings": bookings_count
        },
        "arena_regions": city_counts
    }

@router.get("/technical")
async def get_technical_metrics(db=Depends(get_db), user=Depends(get_current_user)):
    verify_creator(user)
    
    # CPU e Memória
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Mongo DB Stats
    db_stats = await db.command("dbstats")
    
    # Métricas de performance de api (últimos 1000 requests)
    metrics_cursor = db["api_metrics"].find({}).sort("timestamp", -1).limit(1000)
    last_metrics = []
    async for m in metrics_cursor:
        last_metrics.append(m)
        
    avg_ms = 0
    p95_ms = 0
    p99_ms = 0
    error_rate_5xx_percent = 0.0

    if last_metrics:
        durations = sorted([m.get("duration_ms", 0) for m in last_metrics])
        avg_ms = round(sum(durations) / len(durations), 2)
        idx_95 = min(int(len(durations) * 0.95), len(durations) - 1)
        idx_99 = min(int(len(durations) * 0.99), len(durations) - 1)
        
        if idx_95 >= 0: p95_ms = round(durations[idx_95], 2)
        if idx_99 >= 0: p99_ms = round(durations[idx_99], 2)
        
        errors_5xx = sum(1 for m in last_metrics if m.get("status_code", 200) >= 500)
        error_rate_5xx_percent = round((errors_5xx / len(last_metrics)) * 100, 2)

    # Buscando histórico de erros 5xx
    errors_cursor = db["api_errors_5xx"].find({}).sort("timestamp", -1).limit(20)
    error_logs = []
    async for e in errors_cursor:
        error_logs.append({
            "id": str(e["_id"]),
            "timestamp": e.get("timestamp"),
            "path": e.get("path"),
            "method": e.get("method"),
            "status_code": e.get("status_code"),
            "error_message": e.get("error_message")
        })

    return {
        "hardware": {
            "cpu_percent": cpu_percent,
            "memory_total_gb": round(memory.total / (1024**3), 2),
            "memory_used_gb": round(memory.used / (1024**3), 2),
            "memory_percent": memory.percent,
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "disk_used_gb": round(disk.used / (1024**3), 2),
            "disk_percent": disk.percent
        },
        "database": {
            "data_size_mb": round(db_stats.get("dataSize", 0) / (1024**2), 2),
            "storage_size_mb": round(db_stats.get("storageSize", 0) / (1024**2), 2),
            "collections": db_stats.get("collections", 0),
            "objects": db_stats.get("objects", 0)
        },
        "api_performance": {
            "avg_ms": avg_ms,
            "p95_ms": p95_ms,
            "p99_ms": p99_ms,
            "error_rate_5xx_percent": error_rate_5xx_percent,
            "error_logs": error_logs
        }
    }

@router.get("/feedbacks")
async def get_feedbacks(db=Depends(get_db), user=Depends(get_current_user)):
    verify_creator(user)
    
    cursor = db["feedback"].find({}).sort("created_at", -1).limit(100)
    feedbacks = []
    async for f in cursor:
        # Resolve user info se _id estiver atrelado
        user_info = None
        if "user_id" in f and f["user_id"]:
            u = await db["users"].find_one({"_id": ObjectId(f["user_id"])})
            if u:
                user_info = {"name": u.get("name"), "email": u.get("email")}
                
        feedbacks.append({
            "id": str(f["_id"]),
            "title": f.get("title"),
            "description": f.get("description"),
            "type": f.get("type"),
            "created_at": f.get("created_at"),
            "user": user_info
        })
        
    return {"feedbacks": feedbacks}

@router.get("/transactions")
async def get_transactions(db=Depends(get_db), user=Depends(get_current_user)):
    verify_creator(user)
    cursor = db["transactions"].find({}).sort("created_at", -1).limit(100)
    transactions = []
    async for t in cursor:
        transactions.append(t)
    return {"transactions": transactions}

@router.get("/access-logs")
async def get_access_logs(db=Depends(get_db), user=Depends(get_current_user)):
    verify_creator(user)
    cursor = db["access_logs"].find({}).sort("login_time", -1).limit(100)
    logs = []
    async for l in cursor:
        logs.append({
            "id": str(l["_id"]),
            "username": l.get("username"),
            "method": l.get("method"),
            "success": l.get("success"),
            "login_time": l.get("login_time"),
            "ip_address": l.get("ip_address")
        })
    return {"access_logs": logs}
