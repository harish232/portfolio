import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from anthropic import Anthropic
from dotenv import load_dotenv
from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Dict

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(
    title="Harish Portfolio Chatbot API",
    description="Secure backend for AI chatbot integration",
    version="1.0.0"
)

# CORS Configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Initialize Anthropic Client
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY not found in environment variables!")

client = Anthropic(api_key=api_key)

# Rate Limiting Storage
rate_limit_store: Dict[str, List[datetime]] = defaultdict(list)
RATE_LIMIT = 15  # requests per minute per IP


def check_rate_limit(ip: str) -> bool:
    """Check if IP has exceeded rate limit."""
    now = datetime.now()
    rate_limit_store[ip] = [
        t for t in rate_limit_store[ip]
        if now - t < timedelta(minutes=1)
    ]
    if len(rate_limit_store[ip]) >= RATE_LIMIT:
        return False
    rate_limit_store[ip].append(now)
    return True


# Request/Response Models
class ChatMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: List[Dict[str, str]] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    usage: Dict[str, int]


# System Prompt about Harish
SYSTEM_PROMPT = """You are an AI assistant for Harish Babu's portfolio website.

About Harish:
- Name: Harish Babu
- Role: Python Full Stack Developer
- Backend Skills: Python, FastAPI, Flask, Django, REST APIs
- Frontend Skills: HTML5, CSS3, JavaScript, Three.js, React
- Databases: PostgreSQL, MongoDB
- Tools: Git, Docker, AWS, Linux
- Specialties: 3D Web Graphics, AI Integration, Full-stack Development

Featured Projects:
1. 3D Cyberpunk Portfolio - This very website! Three.js, AI chatbot, particle effects
2. AI Chat Assistant - FastAPI backend with Claude AI integration
3. Data Analytics Dashboard - Django + PostgreSQL real-time analytics

Personality: Friendly, professional, enthusiastic about technology.

Instructions:
- Answer questions about Harish's skills, projects, and experience
- Be concise (2-3 sentences for simple questions)
- Use emojis sparingly to keep things engaging
- If asked about contact, mention the contact section on the website
- If asked something unrelated to Harish, politely redirect to portfolio topics
- Never share sensitive information like API keys or personal phone numbers"""


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "Harish Portfolio Chatbot API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "running"
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatMessage, request: Request):
    """Main chat endpoint."""
    
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"
    
    # Rate limiting check
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a minute and try again."
        )
    
    try:
        # Build messages array (limit history to last 6 messages)
        messages = payload.history[-6:] if payload.history else []
        messages.append({"role": "user", "content": payload.message})
        
        # Call Claude API
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=messages
        )
        
        return ChatResponse(
            reply=response.content[0].text,
            usage={
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens
            }
        )
    
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI service is temporarily unavailable. Please try again."
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
