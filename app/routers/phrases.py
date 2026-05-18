from pathlib import Path
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from app.database import get_connection
from app.models import PhraseOut, PhraseCreate, PhraseUpdate

router = APIRouter()
AUDIO_DIR = Path(__file__).resolve().parent.parent.parent / "public" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

SELECT_COLS = """
    SELECT p.id, p.category_id, p.en, p.zh, p.phonetic, p.example,
           COALESCE(p.type, 'phrase') as type,
           p.audio_file,
           COALESCE(pr.status, 'new') as status,
           COALESCE(pr.correct_count, 0) as correct_count,
           COALESCE(pr.wrong_count, 0) as wrong_count,
           pr.last_review, pr.next_review
    FROM phrases p
    LEFT JOIN progress pr ON p.id = pr.phrase_id
"""


@router.get("/phrases", response_model=list[PhraseOut])
def list_phrases(
    category_id: int = Query(None),
    conn=Depends(get_connection),
):
    if category_id:
        rows = conn.execute(SELECT_COLS + " WHERE p.category_id = ? ORDER BY p.id", (category_id,)).fetchall()
    else:
        rows = conn.execute(SELECT_COLS + " ORDER BY p.id").fetchall()
    return [dict(r) for r in rows]


@router.post("/phrases", response_model=PhraseOut)
def create_phrase(body: PhraseCreate, conn=Depends(get_connection)):
    cur = conn.execute(
        "INSERT INTO phrases (category_id, en, zh, type, audio_file) VALUES (?, ?, ?, ?, ?)",
        (body.category_id, body.en, body.zh, body.type, body.audio_file),
    )
    conn.commit()
    row = conn.execute(SELECT_COLS + " WHERE p.id = ?", (cur.lastrowid,)).fetchone()
    return dict(row)


@router.put("/phrases/{phrase_id}", response_model=PhraseOut)
def update_phrase(phrase_id: int, body: PhraseUpdate, conn=Depends(get_connection)):
    fields = {}
    for key in ("en", "zh", "type", "audio_file"):
        val = getattr(body, key, None)
        if val is not None:
            fields[key] = val
    if not fields:
        raise HTTPException(400, "没有要更新的字段")
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [phrase_id]
    conn.execute(f"UPDATE phrases SET {set_clause} WHERE id = ?", values)
    conn.commit()
    row = conn.execute(SELECT_COLS + " WHERE p.id = ?", (phrase_id,)).fetchone()
    if not row:
        raise HTTPException(404, "短语不存在")
    return dict(row)


@router.delete("/phrases/{phrase_id}")
def delete_phrase(phrase_id: int, conn=Depends(get_connection)):
    conn.execute("DELETE FROM phrases WHERE id = ?", (phrase_id,))
    conn.commit()
    return {"success": True}


@router.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".mp3"):
        raise HTTPException(400, "仅支持 MP3 文件")
    file_path = AUDIO_DIR / file.filename
    content = await file.read()
    file_path.write_bytes(content)
    return {"filename": file.filename, "path": f"/audio/{file.filename}"}


@router.get("/review", response_model=list[PhraseOut])
def review_phrases(conn=Depends(get_connection)):
    now = int(__import__("time").time() * 1000)
    rows = conn.execute(SELECT_COLS + """
        WHERE pr.status IS NULL
           OR pr.status = 'learning'
           OR (pr.status = 'mastered' AND pr.next_review IS NOT NULL AND pr.next_review <= ?)
        ORDER BY p.id
    """, (now,)).fetchall()
    return [dict(r) for r in rows]
