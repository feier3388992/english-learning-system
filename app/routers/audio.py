import time
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File

from app.database import get_connection

AUDIO_DIR = Path(__file__).resolve().parent.parent.parent / "public" / "audio"

router = APIRouter()


@router.get("/audio-files")
def list_audio_files():
    if not AUDIO_DIR.exists():
        return []
    files = []
    for f in sorted(AUDIO_DIR.iterdir()):
        if f.suffix.lower() in (".mp3", ".wav", ".ogg", ".m4a"):
            files.append({
                "name": f.name,
                "size": f.stat().st_size,
                "path": f"/audio/{f.name}",
            })
    return files


@router.delete("/audio/{filename}")
def delete_audio(filename: str):
    file_path = AUDIO_DIR / filename
    if not file_path.exists():
        raise HTTPException(404, "文件不存在")
    if file_path.suffix.lower() not in (".mp3", ".wav", ".ogg", ".m4a"):
        raise HTTPException(400, "不允许删除此类文件")
    file_path.unlink()
    return {"success": True, "filename": filename}


@router.post("/record-audio/{phrase_id}")
async def record_audio(phrase_id: int, file: UploadFile = File(...)):
    content = await file.read()
    suffix = Path(file.filename).suffix or ".webm"
    temp_name = f"temp_{phrase_id}_{int(time.time())}{suffix}"
    temp_path = AUDIO_DIR / temp_name

    try:
        temp_path.write_bytes(content)

        from pydub import AudioSegment
        mp3_filename = f"rec_{phrase_id}.mp3"
        mp3_path = AUDIO_DIR / mp3_filename

        audio = AudioSegment.from_file(str(temp_path))
        audio.export(str(mp3_path), format="mp3")

        conn = get_connection()
        conn.execute(
            "UPDATE phrases SET audio_file = ? WHERE id = ?",
            (mp3_filename, phrase_id),
        )
        conn.commit()
        conn.close()

        return {"filename": mp3_filename, "path": f"/audio/{mp3_filename}"}
    except Exception as e:
        raise HTTPException(500, f"音频处理失败: {str(e)}")
    finally:
        if temp_path.exists():
            temp_path.unlink()
