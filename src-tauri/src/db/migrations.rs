use sqlx::SqlitePool;
use crate::db::queries::*;

pub async fn run_migrations(pool: &SqlitePool) -> Result<(), String> {
    // Transactional schema migration using PRAGMA user_version
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    
    let version: i32 = sqlx::query_scalar("PRAGMA user_version")
        .fetch_one(&mut *tx)
        .await
        .unwrap_or(0);

    if version < 1 {
        sqlx::query(SCHEMA_V1).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    if version < 2 {
        sqlx::query(SCHEMA_V2).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    if version < 3 {
        sqlx::query(SCHEMA_V3).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    if version < 4 {
        sqlx::query(SCHEMA_V4).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    if version < 5 {
        sqlx::query(SCHEMA_V5).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    if version < 6 {
        sqlx::query(SCHEMA_V6).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    if version < 7 {
        sqlx::query(SCHEMA_V7).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    if version < 8 {
        sqlx::query(SCHEMA_V8).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
