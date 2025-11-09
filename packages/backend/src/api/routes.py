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


@api_bp.route('/job-postings/check', methods=['GET', 'OPTIONS'])
def check_job_posting():
    """Check if a job posting already exists in Notion database.
    
    Query parameters:
        posting_url: URL of the LinkedIn job posting
    
    Returns:
        200: {"exists": true, "page_id": "...", "page_url": "..."}
        200: {"exists": false}
        400: {"error": "posting_url parameter is required"}
    """
    logger.info("=== Received request to /api/job-postings/check ===")
    
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        logger.info("Handling OPTIONS preflight request")
        return '', 204
    
    posting_url = request.args.get('posting_url')
    
    if not posting_url:
        logger.warning("Missing posting_url parameter")
        return jsonify({"error": "posting_url parameter is required"}), 400
    
    logger.info(f"Checking if job exists: {posting_url}")
    
    try:
        # Check for duplicate
        existing_page_id = notion_service.check_duplicate(posting_url)
        
        if existing_page_id:
            # Construct Notion page URL
            page_url = f"https://www.notion.so/{existing_page_id.replace('-', '')}"
            logger.info(f"Job exists with page ID: {existing_page_id}")
            
            return jsonify({
                "exists": True,
                "page_id": existing_page_id,
                "page_url": page_url
            }), 200
        else:
            logger.info("Job does not exist")
            return jsonify({"exists": False}), 200
            
    except APIResponseError as e:
        logger.error(f"Notion API error during check: {e.code} - {str(e)}")
        return jsonify({"error": "Failed to check job existence", "details": str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error during check: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@api_bp.route('/job-postings', methods=['POST', 'OPTIONS'])
def create_job_posting():
    """Create or update job posting in Notion database.
    
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
        "country": "United States",  # optional
        "page_id": "existing-page-id"  # optional, for updates
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
    
    # Check if this is an update (page_id provided) or create
    page_id_to_update = data.get('page_id')
    is_update = page_id_to_update is not None
    
    if not is_update:
        # Check for duplicate only when creating
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
    
    # Create or update page in Notion
    try:
        if is_update:
            logger.info(f"Updating existing Notion page: {page_id_to_update}")
            page = notion_service.update_job_posting(
                page_id=page_id_to_update,
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
            message = "Job posting updated successfully"
        else:
            logger.info("Creating new Notion page")
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
            message = "Job posting saved successfully"
        
        page_id = page['id']
        page_url = page['url']
        
        logger.info(f"Successfully {'updated' if is_update else 'created'} Notion page: {page_id}")
        return jsonify({
            "message": message,
            "notion_page_id": page_id,
            "notion_page_url": page_url,
            "job_data": data
        }), 200 if is_update else 201
        
    except APIResponseError as e:
        logger.error(f"Notion API error: {e.code} - {str(e)}")
        
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
