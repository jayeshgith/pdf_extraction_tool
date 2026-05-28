import os
from openai import OpenAI

client = None
api_key = os.environ.get("OPENAI_API_KEY")
if api_key:
    client = OpenAI(api_key=api_key)


def ask_question(raw_text: str, extracted_data: dict, question: str) -> str:
    if not client:
        return "OpenAI is not configured. Set OPENAI_API_KEY in .env"

    extracted_str = "\n".join(
        f"  {k}: {v}" for k, v in extracted_data.items() if v
    ) if extracted_data else "  (no fields extracted yet)"

    system_prompt = (
        "You are a helpful document assistant for DocuVerse. "
        "Answer the user's question based ONLY on the document provided below.\n"
        "Be concise (1-3 sentences). "
        "If the answer is not in the document, say 'I couldn't find that in your document.'"
    )

    user_prompt = f"""Document text:
{raw_text}

Extracted data:
{extracted_str}

User question: {question}"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=300,
            temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"Sorry, I couldn't process that. Error: {str(e)}"
