from openai import AsyncOpenAI
from app.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url="https://api.groq.com/openai/v1")


async def generate_result_summary(student_name: str, results: list) -> str:
    """Turns a list of {course_name, marks, grade} into a plain-language summary."""
    if not results:
        return "No published results yet to summarize."

    results_text = "\n".join(
        f"- {r['course_name']}: {r['marks']} marks, grade {r['grade']}" for r in results
    )
    prompt = (
        f"You are an academic advisor. Student {student_name} has these results:\n"
        f"{results_text}\n\n"
        "Write a short, encouraging 3-4 sentence summary of their performance, "
        "point out their strongest subject, and suggest one area to improve."
    )

    response = await client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=250,
    )
    return response.choices[0].message.content


async def enrollment_chat(user_message: str, available_courses: list, history: list) -> str:
    """RAG-style chatbot answering enrollment questions using live course data."""
    courses_text = "\n".join(
        f"- {c['name']} ({c['code']}): {c['credits']} credits"
        for c in available_courses
    ) or "No courses currently available."

    system_prompt = (
        "You are a helpful university enrollment assistant. Answer using the "
        "course catalog given below. Keep answers concise and student-friendly.\n\nCurrent courses:\n" + courses_text
    )

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-6:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_message})

    response = await client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=messages,
        max_tokens=300,
    )
    return response.choices[0].message.content


async def generate_faculty_remark(
    student_name: str, course_name: str, marks: float, grade: str, context: str | None = None
) -> str:
    context_instruction = (
        f"\nAdditional faculty observation/notes: \"{context}\". Incorporate this context seamlessly into the feedback."
        if context
        else ""
    )
    prompt = (
        f"Student {student_name} scored {marks} marks (grade {grade}) in {course_name}.{context_instruction}\n"
        "Write one short, encouraging and professional feedback remark (2-3 sentences max) a faculty member "
        "could add to their official report card."
    )
    response = await client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
    )
    return response.choices[0].message.content
