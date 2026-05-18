from fastapi import APIRouter, Depends
from app.database import get_connection
from app.models import ProgressUpdate

router = APIRouter()


@router.post("/progress/{phrase_id}")
def update_progress(phrase_id: int, body: ProgressUpdate, conn=Depends(get_connection)):
    row = conn.execute(
        "SELECT * FROM progress WHERE phrase_id = ?", (phrase_id,)
    ).fetchone()

    status = "new"
    correct_count = 0
    wrong_count = 0
    last_review = int(__import__("time").time() * 1000)

    if row:
        status = row["status"] or "new"
        correct_count = row["correct_count"] or 0
        wrong_count = row["wrong_count"] or 0

    if body.is_correct:
        correct_count += 1
        wrong_count = 0
        if correct_count >= 3:
            status = "mastered"
        else:
            status = "learning"
    else:
        wrong_count += 1
        correct_count = 0
        status = "learning"

    next_review = last_review + (24 * 60 * 60 * 1000 if status == "mastered" else 0)

    conn.execute("""
        INSERT INTO progress (phrase_id, status, correct_count, wrong_count, last_review, next_review)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(phrase_id) DO UPDATE SET
            status = excluded.status,
            correct_count = excluded.correct_count,
            wrong_count = excluded.wrong_count,
            last_review = excluded.last_review,
            next_review = excluded.next_review
    """, (phrase_id, status, correct_count, wrong_count, last_review, next_review))

    conn.execute("""
        UPDATE stats SET
            total_answers = total_answers + 1,
            correct_answers = correct_answers + ?,
            wrong_answers = wrong_answers + ?
        WHERE id = 1
    """, (1 if body.is_correct else 0, 0 if body.is_correct else 1))

    conn.commit()
    return {"success": True, "status": status, "correct_count": correct_count}


@router.delete("/reset")
def reset_progress(conn=Depends(get_connection)):
    conn.execute("DELETE FROM progress")
    conn.execute("UPDATE stats SET total_answers = 0, correct_answers = 0, wrong_answers = 0 WHERE id = 1")
    conn.commit()
    return {"success": True}
