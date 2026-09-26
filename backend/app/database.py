import certifi
from motor .motor_asyncio import AsyncIOMotorClient
from app.config import settings

client=AsyncIOMotorClient(settings.MONGO_URI)
db=client[settings.DB_NAME]

users_collection=db["users"]
courses_collection=db["courses"]
enrollments_collection=db["enrollments"]
results_collection=db["results"]
students_collection=db["students"]
exams_collection=db["exams"]
notices_collection=db["notices"]