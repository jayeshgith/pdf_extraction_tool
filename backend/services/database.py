import os
from pymongo import MongoClient

_mongo_client = None

def get_db():
    global _mongo_client
    if _mongo_client is None:
        url = os.environ["MONGODB_URL"]
        db_name = os.environ.get("DATABASE_NAME", "docuverse")
        _mongo_client = MongoClient(
            url,
            connectTimeoutMS=20000,
            serverSelectionTimeoutMS=30000,
        )
    return _mongo_client[os.environ.get("DATABASE_NAME", "docuverse")]
