"""Request validation logic."""
import re
from typing import Dict, Optional

LINKEDIN_URL_PATTERN = re.compile(
    r'^https://www\.linkedin\.com/jobs/(view|collections)/.+$'
)


def validate_job_posting(data: Dict) -> tuple[bool, Optional[str]]:
    """Validate job posting request data.
    
    Args:
        data: Request JSON payload
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check required fields
    required_fields = ['position', 'company', 'posting_url', 'origin']
    for field in required_fields:
        if field not in data:
            return False, f"{field} is required"
        
        # Check for empty strings
        if isinstance(data[field], str) and not data[field].strip():
            return False, f"{field} cannot be empty"
    
    # Validate position length
    if len(data['position']) > 500:
        return False, "position must be 500 characters or less"
    
    # Validate company length
    if len(data['company']) > 200:
        return False, "company must be 200 characters or less"
    
    # Validate LinkedIn URL format
    if not LINKEDIN_URL_PATTERN.match(data['posting_url']):
        return False, "posting_url must be a valid LinkedIn job URL"
    
    # Validate origin
    if data['origin'] != 'LinkedIn':
        return False, "origin must be 'LinkedIn'"
    
    # Validate optional fields if provided
    if 'match' in data and data['match']:
        if data['match'] not in ['low', 'medium', 'high']:
            return False, "match must be one of: low, medium, high"
    
    if 'work_arrangement' in data and data['work_arrangement']:
        if data['work_arrangement'] not in ['remote', 'hybrid', 'on-site']:
            return False, "work_arrangement must be one of: remote, hybrid, on-site"
    
    if 'demand' in data and data['demand']:
        if data['demand'] not in ['0-50', '51-200', '201-500', '500+']:
            return False, "demand must be one of: 0-50, 51-200, 201-500, 500+"
    
    if 'budget' in data and data['budget'] is not None:
        try:
            budget = float(data['budget'])
            if budget < 0:
                return False, "budget must be a positive number"
        except (ValueError, TypeError):
            return False, "budget must be a number"
    
    if 'city' in data and data['city']:
        if len(data['city']) > 200:
            return False, "city must not exceed 200 characters"
    
    if 'country' in data and data['country']:
        if len(data['country']) > 200:
            return False, "country must not exceed 200 characters"
    
    if 'job_description' in data and data['job_description']:
        if len(data['job_description']) > 50000:
            return False, "job_description must not exceed 50000 characters"
    
    return True, None
