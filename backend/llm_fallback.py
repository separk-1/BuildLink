import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def call_openai(question: str, context: str):
    messages = [
        {
            "role": "system",
            "content": "You are a nuclear plant operations assistant. Be concise and procedural."
        },
        {
            "role": "user",
            "content": f"CONTEXT:\n{context}\n\nQUESTION:\n{question}"
        }
    ]

    r = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=messages,
        temperature=0.2,
    )

    return {"answer": r.choices[0].message.content}
