"""
Script de migração para adicionar owners como admins em grupos existentes.

Este script atualiza todos os grupos no MongoDB para garantir que:
1. Cada grupo tenha o campo 'admins' (lista)
2. O owner_id esteja sempre incluído na lista de admins

Execução: python migrate_group_admins.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import sys
import os

# Adicionar o diretório app ao path para importar config
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings

# Configurações do MongoDB (usando as mesmas do aplicativo)
MONGODB_URL = settings.MONGODB_URL
DATABASE_NAME = settings.DB_NAME


async def migrate_group_admins():
    """Migra grupos existentes para incluir owner como admin."""
    
    print("🚀 Iniciando migração de admins de grupos...")
    print(f"📊 Conectando ao MongoDB: {MONGODB_URL}")
    
    # Conectar ao MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    groups_collection = db["groups"]
    
    try:
        # Buscar todos os grupos
        groups = await groups_collection.find({}).to_list(length=None)
        total_groups = len(groups)
        
        print(f"📦 Encontrados {total_groups} grupos para migrar\n")
        
        updated_count = 0
        skipped_count = 0
        error_count = 0
        
        for i, group in enumerate(groups, 1):
            group_id = group["_id"]
            owner_id = group.get("owner_id")
            
            if not owner_id:
                print(f"⚠️  Grupo {group_id} não tem owner_id - pulando")
                error_count += 1
                continue
            
            # Obter lista atual de admins
            current_admins = group.get("admins", [])
            
            # Converter para ObjectId se necessário
            if isinstance(owner_id, str):
                owner_id = ObjectId(owner_id)
            
            # Verificar se owner já está na lista de admins
            if owner_id in current_admins:
                print(f"✓ Grupo {i}/{total_groups}: {group.get('name', 'Sem nome')} - Owner já é admin (pulando)")
                skipped_count += 1
                continue
            
            # Adicionar owner à lista de admins
            new_admins = [owner_id] + current_admins
            
            # Atualizar grupo
            result = await groups_collection.update_one(
                {"_id": group_id},
                {"$set": {"admins": new_admins}}
            )
            
            if result.modified_count > 0:
                print(f"✅ Grupo {i}/{total_groups}: {group.get('name', 'Sem nome')} - Owner adicionado como admin")
                updated_count += 1
            else:
                print(f"⚠️  Grupo {i}/{total_groups}: {group.get('name', 'Sem nome')} - Falha ao atualizar")
                error_count += 1
        
        # Resumo final
        print("\n" + "="*60)
        print("📊 RESUMO DA MIGRAÇÃO")
        print("="*60)
        print(f"Total de grupos: {total_groups}")
        print(f"✅ Atualizados: {updated_count}")
        print(f"⏭️  Já atualizados (pulados): {skipped_count}")
        print(f"❌ Erros: {error_count}")
        print("="*60)
        
        if updated_count > 0:
            print("\n🎉 Migração concluída com sucesso!")
        elif skipped_count == total_groups:
            print("\n✓ Todos os grupos já estavam atualizados!")
        else:
            print("\n⚠️  Migração concluída com alguns problemas.")
    
    except Exception as e:
        print(f"\n❌ Erro durante a migração: {e}")
        raise
    
    finally:
        # Fechar conexão
        client.close()
        print("\n🔌 Conexão com MongoDB encerrada.")


async def verify_migration():
    """Verifica se a migração foi bem-sucedida."""
    
    print("\n🔍 Verificando migração...")
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    groups_collection = db["groups"]
    
    try:
        # Buscar grupos sem campo admins ou com owner não incluído
        groups_without_admins = await groups_collection.count_documents({"admins": {"$exists": False}})
        
        # Buscar todos os grupos para verificar se owner está em admins
        all_groups = await groups_collection.find({}).to_list(length=None)
        
        groups_owner_not_admin = 0
        for group in all_groups:
            owner_id = group.get("owner_id")
            admins = group.get("admins", [])
            
            if isinstance(owner_id, str):
                owner_id = ObjectId(owner_id)
            
            if owner_id and owner_id not in admins:
                groups_owner_not_admin += 1
        
        print(f"Grupos sem campo 'admins': {groups_without_admins}")
        print(f"Grupos onde owner não está em admins: {groups_owner_not_admin}")
        
        if groups_without_admins == 0 and groups_owner_not_admin == 0:
            print("✅ Migração verificada com sucesso!")
        else:
            print("⚠️  Ainda existem grupos com problemas.")
    
    finally:
        client.close()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🔄 MIGRAÇÃO DE ADMINS DE GRUPOS")
    print("="*60 + "\n")
    
    # Executar migração
    asyncio.run(migrate_group_admins())
    
    # Verificar migração
    asyncio.run(verify_migration())
    
    print("\n✨ Processo finalizado!")
