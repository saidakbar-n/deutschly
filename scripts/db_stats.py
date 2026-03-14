from sqlalchemy import inspect
from app.core.database import engine


def main():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print({"tables": tables})


if __name__ == "__main__":
    main()
