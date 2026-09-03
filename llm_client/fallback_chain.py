import os
from typing import Optional, Literal
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

Provider = Literal["deepseek", "groq", "openrouter"]


class LLMClient:
    """OpenAI-compatible client with automatic fallback: DeepSeek -> Groq -> OpenRouter."""

    def __init__(self):
        self.providers = {
            "deepseek": {
                "client": OpenAI(
                    base_url="https://api.deepseek.com",
                    api_key=os.getenv("DEEPSEEK_API_KEY", "")
                ),
                "model": "deepseek-chat",
            },
            "groq": {
                "client": OpenAI(
                    base_url="https://api.groq.com/openai/v1",
                    api_key=os.getenv("GROQ_API_KEY", "")
                ),
                "model": "llama-3.3-70b-versatile",
            },
            "openrouter": {
                "client": OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=os.getenv("OPENROUTER_API_KEY", "")
                ),
                "model": "openai/gpt-4o-mini",
            },
        }
        self.order: list[Provider] = ["deepseek", "groq", "openrouter"]

    def complete(self, prompt: str, system: str = "", max_tokens: int = 500) -> tuple[str, Provider]:
        """Try providers in order. Returns (response_text, provider_used).
        Raises RuntimeError if all providers fail."""
        errors = []
        for provider in self.order:
            cfg = self.providers[provider]
            if not cfg["client"].api_key:
                errors.append(f"{provider}: missing API key")
                continue
            try:
                resp = cfg["client"].chat.completions.create(
                    model=cfg["model"],
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    max_tokens=max_tokens,
                    temperature=0.2,
                )
                text = resp.choices[0].message.content.strip()
                return text, provider
            except Exception as e:
                errors.append(f"{provider}: {e}")
                continue
        raise RuntimeError(f"All providers failed: {' | '.join(errors)}")
