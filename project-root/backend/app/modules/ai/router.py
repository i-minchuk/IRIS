from fastapi import APIRouter
from app.ai.chatbot import chat_with_ai

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(request: dict):
    return await chat_with_ai(request.get("query", ""))
