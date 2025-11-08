"""API endpoint definitions."""
from flask import Blueprint, request, jsonify
from notion_client.errors import APIResponseError
import logging

from ..services.notion_service import NotionService
from ..api.validators import validate_job_posting
from ..config.settings import Config

logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__, url_prefix='/api')

# Initialize Notion service
notion_service = NotionService(
    api_key=str(Config.NOTION_API_KEY),
    database_id=str(Config.NOTION_DATABASE_JOB_APPLICATIONS_ID),
    companies_database_id=Config.NOTION_DATABASE_COMPANIES_ID
)


@api_bp.route('/job-postings', methods=['POST', 'OPTIONS'])
def create_job_posting():
    """Create new job posting in Notion database.
    
    Expected JSON:
    {
        "position": "Senior Software Engineer",
        "company": "Acme Corp",
        "posting_url": "https://www.linkedin.com/jobs/view/1234567890",
        "origin": "LinkedIn",
        "match": "high",  # optional
        "work_arrangement": "remote",  # optional
        "demand": "201-500",  # optional
        "budget": 150000,  # optional
        "job_description": "...",  # optional
        "city": "San Francisco",  # optional
        "country": "United States"  # optional
    }
    """
    logger.info("=== Received request to /api/job-postings ===")
    logger.info(f"Request method: {request.method}")
    logger.info(f"Request headers: {dict(request.headers)}")
    
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        logger.info("Handling OPTIONS preflight request")
        return '', 204
    
    data = request.get_json()
    logger.info(f"Received job posting request: {data.get('position', 'N/A') if data else 'NO DATA'} at {data.get('company', 'N/A') if data else 'NO DATA'}")
    
    # Validate request
    is_valid, error_msg = validate_job_posting(data)
    if not is_valid:
        logger.warning(f"Validation failed: {error_msg}")
        return jsonify({"error": error_msg}), 400
    
    # Check for duplicate
    existing_page_id = notion_service.check_duplicate(data['posting_url'])
    if existing_page_id:
        page_url = f"https://www.notion.so/{existing_page_id.replace('-', '')}"
        logger.warning(f"Duplicate job posting detected: {data['posting_url']}")
        return jsonify({
            "error": "Job posting already saved",
            "duplicate_field": "posting_url",
            "existing_page_id": existing_page_id,
            "existing_page_url": page_url
        }), 409
    
    # Create page in Notion
    try:
        page = notion_service.create_job_posting(
            position=data['position'],
            company=data['company'],
            posting_url=data['posting_url'],
            origin=data['origin'],
            match=data.get('match'),
            work_arrangement=data.get('work_arrangement'),
            demand=data.get('demand'),
            budget=data.get('budget'),
            job_description=data.get('job_description'),
            city=data.get('city'),
            country=data.get('country')
        )
        
        page_id = page['id']
        page_url = page['url']
        
        logger.info(f"Successfully created Notion page: {page_id}")
        return jsonify({
            "message": "Job posting saved successfully",
            "notion_page_id": page_id,
            "notion_page_url": page_url,
            "job_data": data
        }), 201
        
    except APIResponseError as e:
        logger.error(f"Notion API error: {e.code} - {e.message}")
        
        if e.code == 'unauthorized':
            return jsonify({"error": "Notion authentication failed"}), 401
        elif e.code == 'object_not_found':
            return jsonify({"error": "Notion database not found"}), 404
        elif e.code == 'rate_limited':
            return jsonify({
                "error": "Rate limit exceeded",
                "retry_after": 60
            }), 429
        else:
            return jsonify({"error": "Internal server error", "details": str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    logger.info("Health check requested")
    is_valid, error_msg = notion_service.validate_database()
    
    if is_valid:
        logger.info("Health check passed")
        return jsonify({
            "status": "healthy",
            "notion_connected": True,
            "database_validated": True
        }), 200
    else:
        logger.error(f"Health check failed: {error_msg}")
        return jsonify({
            "status": "unhealthy",
            "notion_connected": False,
            "database_validated": False,
            "error": error_msg
        }), 500
