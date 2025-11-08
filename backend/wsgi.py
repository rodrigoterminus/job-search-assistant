"""Application entry point for local development.

Run with:
    python wsgi.py
    OR
    flask run --debug
"""
from src.app import create_app
from src.config.settings import Config

app = create_app()

if __name__ == "__main__":
    print(f"Starting server on http://127.0.0.1:{Config.FLASK_PORT}")
    app.run(
        host='127.0.0.1',
        port=Config.FLASK_PORT,
        debug=Config.FLASK_DEBUG
    )
