from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import get_connection
from app.models import CategoryOut

router = APIRouter()


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(conn=Depends(get_connection)):
    rows = conn.execute("""
        SELECT c.*, COUNT(p.id) as phrase_count
        FROM categories c
        LEFT JOIN phrases p ON c.id = p.category_id
        GROUP BY c.id
        ORDER BY c.id
    """).fetchall()
    return [dict(r) for r in rows]


@router.post("/categories", response_model=CategoryOut)
def create_category(body: CategoryCreate, conn=Depends(get_connection)):
    try:
        cur = conn.execute(
            "INSERT INTO categories (name, description) VALUES (?, ?)",
            (body.name, body.description or body.name),
        )
        conn.commit()
    except Exception as e:
        raise HTTPException(400, f"创建失败（可能名称重复）: {e}")
    row = conn.execute("""
        SELECT c.*, COUNT(p.id) as phrase_count
        FROM categories c
        LEFT JOIN phrases p ON c.id = p.category_id
        WHERE c.id = ?
        GROUP BY c.id
    """, (cur.lastrowid,)).fetchone()
    return dict(row)


@router.put("/categories/{cat_id}", response_model=CategoryOut)
def update_category(cat_id: int, body: CategoryCreate, conn=Depends(get_connection)):
    conn.execute(
        "UPDATE categories SET name = ?, description = ? WHERE id = ?",
        (body.name, body.description or body.name, cat_id),
    )
    conn.commit()
    row = conn.execute("""
        SELECT c.*, COUNT(p.id) as phrase_count
        FROM categories c
        LEFT JOIN phrases p ON c.id = p.category_id
        WHERE c.id = ?
        GROUP BY c.id
    """, (cat_id,)).fetchone()
    if not row:
        raise HTTPException(404, "分类不存在")
    return dict(row)


@router.delete("/categories/{cat_id}")
def delete_category(cat_id: int, conn=Depends(get_connection)):
    conn.execute("DELETE FROM categories WHERE id = ?", (cat_id,))
    conn.commit()
    return {"success": True}
