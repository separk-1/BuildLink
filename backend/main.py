from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
import time
import random

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str
    context: str

@app.get("/")
def read_root():
    return {"message": "NPP Simulator Backend (Prototype)"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

def _sleep_backoff(i: int):
    time.sleep(0.6 * (2 ** i) + random.random() * 0.2)

@app.post("/api/chat")
def chat_with_gemini(request: ChatRequest):
    api_key = os.environ.get("VITE_GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="Server Configuration Error: API Key missing")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    payload = {
        "contents": [{
            "parts": [{
                "text": f"""
You are an operations assistant for a PWR LOFW training simulator.
Use only the provided procedure graph context.
Be concise and safety-oriented.

CONTEXT:
{request.context}

QUESTION:
{request.question}

Return:
- Answer (2–4 sentences)
- Next step (one action)
"""
            }]
        }]
    }

    last_error = None

    for i in range(3):  # 최대 3회 시도
        try:
            response = requests.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=60,
            )

            if response.status_code == 429:
                if i < 2:
                    _sleep_backoff(i)
                    continue
                from backend.llm_fallback import call_openai
                return call_openai(request.question, request.context)

            response.raise_for_status()
            data = response.json()

            return {
                "answer": data["candidates"][0]["content"]["parts"][0]["text"]
            }

        except requests.exceptions.HTTPError as e:
            last_error = e
            break
        except requests.exceptions.RequestException as e:
            last_error = e
            break

    print(f"Gemini API Error: {last_error}")
    raise HTTPException(status_code=502, detail="Failed to contact AI service")
