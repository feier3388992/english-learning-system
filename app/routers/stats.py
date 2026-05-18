from fastapi import APIRouter, Depends
from app.database import get_connection
from app.models import StatsOut

router = APIRouter()


@router.get("/stats", response_model=StatsOut)
def get_stats(conn=Depends(get_connection)):
    total_phrases = conn.execute("SELECT COUNT(*) FROM phrases").fetchone()[0]

    row = conn.execute("SELECT * FROM stats WHERE id = 1").fetchone()
    total_answers = row["total_answers"] if row else 0
    correct_answers = row["correct_answers"] if row else 0
    wrong_answers = row["wrong_answers"] if row else 0

    mastered = conn.execute(
        "SELECT COUNT(*) FROM progress WHERE status = 'mastered'"
    ).fetchone()[0]

    learning = conn.execute(
        "SELECT COUNT(*) FROM progress WHERE status = 'learning'"
    ).fetchone()[0]

    new_count = total_phrases - mastered - learning
    accuracy = round((correct_answers / total_answers * 100), 1) if total_answers > 0 else 0.0

    return StatsOut(
        total_phrases=total_phrases,
        total_answers=total_answers,
        correct_answers=correct_answers,
        wrong_answers=wrong_answers,
        accuracy=accuracy,
        mastered=mastered,
        learning=learning,
        new_count=new_count,
    )
