from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv
load_dotenv()

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
                You are an AI Advisor for a Nuclear Power Plant Operator.
                Use the following Knowledge Graph context (Procedures and System State) to answer the user's question.
                Be concise, professional, and safety-oriented.

                CONTEXT:
                {request.context}

                USER QUESTION:
                {request.question}
                """
            }]
        }]
    }

    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
        response.raise_for_status()
        data = response.json()

        try:
            return {"answer": data["candidates"][0]["content"]["parts"][0]["text"]}
        except (KeyError, IndexError):
            return {"answer": "Error parsing AI response."}

    except requests.exceptions.RequestException as e:
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=502, detail="Failed to contact AI service")
