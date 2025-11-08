"""Flask application factory."""
from flask import Flask
from flask_cors import CORS
import logging

from .config.settings import Config
from .api.routes import api_bp


def create_app():
    """Application factory pattern for Flask.
    
    Returns:
        Flask: Configured Flask application instance
    """
    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG if Config.FLASK_DEBUG else logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger = logging.getLogger(__name__)
    
    # Validate configuration on startup
    try:
        Config.validate()
        logger.info("✓ Configuration validated successfully")
    except ValueError as e:
        logger.error(f"✗ Configuration error: {e}")
        raise
    
    # Create Flask app
    app = Flask(__name__)
    
    # Load config into Flask
    app.config['DEBUG'] = Config.FLASK_DEBUG
    
    # Configure CORS - open for development
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(api_bp)
    
    logger.info("✓ Flask application created successfully")
    
    return app
