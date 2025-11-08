"""Application configuration from environment variables."""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration from environment variables."""
    
    # Notion API
    NOTION_API_KEY = os.getenv('NOTION_API_KEY')
    NOTION_DATABASE_JOB_APPLICATIONS_ID = os.getenv('NOTION_DATABASE_JOB_APPLICATIONS_ID')
    NOTION_DATABASE_COMPANIES_ID = os.getenv('NOTION_DATABASE_COMPANIES_ID')
    NOTION_DATABASE_PEOPLE_ID = os.getenv('NOTION_DATABASE_PEOPLE_ID')
    NOTION_DATABASE_RESOURCES_ID = os.getenv('NOTION_DATABASE_RESOURCES_ID')
    
    # Notion Template Pages
    NOTION_TEMPLATE_JOB_APPLICATION_ID = os.getenv('NOTION_TEMPLATE_JOB_APPLICATION_ID')
    
    # Flask
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    FLASK_PORT = int(os.getenv('FLASK_PORT', 3000))
    
    # CORS - Allow Chrome Extension origins and localhost for development
    CORS_ORIGINS = ['chrome-extension://*', 'http://localhost:*', 'http://127.0.0.1:*']
    
    @classmethod
    def validate(cls):
        """Validate required configuration is present."""
        if not cls.NOTION_API_KEY:
            raise ValueError("NOTION_API_KEY environment variable is required")
        if not cls.NOTION_DATABASE_JOB_APPLICATIONS_ID:
            raise ValueError("NOTION_DATABASE_JOB_APPLICATIONS_ID environment variable is required")
        # Note: Companies, People, and Resources databases are optional for MVP
        # They will be required when implementing advanced features
