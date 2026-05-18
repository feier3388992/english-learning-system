from pydantic import BaseModel
from typing import Optional


class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    phrase_count: int = 0


class PhraseOut(BaseModel):
    id: int
    category_id: int
    en: str
    zh: Optional[str] = None
    phonetic: Optional[str] = None
    example: Optional[str] = None
    type: str = "phrase"
    audio_file: Optional[str] = None
    status: Optional[str] = "new"
    correct_count: int = 0
    wrong_count: int = 0
    last_review: Optional[int] = None
    next_review: Optional[int] = None


class PhraseCreate(BaseModel):
    category_id: int
    en: str
    zh: Optional[str] = None
    type: str = "phrase"
    audio_file: Optional[str] = None


class PhraseUpdate(BaseModel):
    en: Optional[str] = None
    zh: Optional[str] = None
    type: Optional[str] = None
    audio_file: Optional[str] = None


class ProgressUpdate(BaseModel):
    is_correct: bool


class StatsOut(BaseModel):
    total_phrases: int = 0
    total_answers: int = 0
    correct_answers: int = 0
    wrong_answers: int = 0
    accuracy: float = 0.0
    mastered: int = 0
    learning: int = 0
    new_count: int = 0
