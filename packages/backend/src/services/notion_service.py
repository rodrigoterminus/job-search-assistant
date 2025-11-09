"""Service for interacting with Notion API."""
from notion_client import Client
from notion_client.errors import APIResponseError
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class NotionService:
    """Service for interacting with Notion API."""
    
    def __init__(self, api_key: str, database_id: str, companies_database_id: Optional[str] = None):
        """Initialize Notion service with API credentials.
        
        Args:
            api_key: Notion integration API key
            database_id: Notion database ID for job applications
            companies_database_id: Notion database ID for companies (optional)
        """
        self.client = Client(auth=api_key)
        self.database_id = database_id
        self.companies_database_id = companies_database_id
        
    def validate_database(self) -> tuple[bool, Optional[str]]:
        """Validate database exists and has required properties.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            db = self.client.databases.retrieve(database_id=self.database_id)
            properties = db.get('properties', {})
            
            required_props = {
                'Position': 'title',
                'Company': 'rich_text',
                'Posting URL': 'url',
                'Origin': 'select'
            }
            
            for prop_name, prop_type in required_props.items():
                if prop_name not in properties:
                    return False, f"Missing required property: {prop_name}"
                if properties[prop_name]['type'] != prop_type:
                    return False, f"Property {prop_name} must be type {prop_type}"
            
            return True, None
            
        except APIResponseError as e:
            logger.error(f"Notion API error during validation: {e}")
            return False, str(e)
    
    def check_duplicate(self, posting_url: str) -> Optional[str]:
        """Check if job posting URL already exists in database.
        
        Args:
            posting_url: LinkedIn job posting URL
            
        Returns:
            Existing page ID if duplicate found, None otherwise
        """
        try:
            response = self.client.databases.query(
                database_id=self.database_id,
                filter={
                    "property": "Posting URL",
                    "url": {
                        "equals": posting_url
                    }
                }
            )
            
            if response.get('results'):
                return response['results'][0]['id']
            return None
            
        except APIResponseError as e:
            logger.error(f"Error checking for duplicates: {e}")
            return None
    
    def find_or_create_company(self, company_name: str) -> Optional[str]:
        """Find existing company or create new one in Companies database.
        
        Args:
            company_name: Name of the company
            
        Returns:
            Company page ID if successful, None otherwise
        """
        if not self.companies_database_id:
            logger.warning("Companies database ID not configured, skipping company lookup")
            return None
        
        try:
            # Search for existing company
            response = self.client.databases.query(
                database_id=self.companies_database_id,
                filter={
                    "property": "Name",
                    "title": {
                        "equals": company_name
                    }
                }
            )
            
            # Return existing company if found
            if response.get('results'):
                company_id = response['results'][0]['id']
                logger.info(f"Found existing company: {company_name} (ID: {company_id})")
                return company_id
            
            # Create new company with icon
            logger.info(f"Creating new company: {company_name}")
            
            new_company = self.client.pages.create(
                parent={"database_id": self.companies_database_id},
                icon={
                    "type": "external",
                    "external": {
                        "url": "https://www.notion.so/icons/factory_gray.svg"
                    }
                },
                properties={
                    "Name": {
                        "title": [
                            {
                                "text": {
                                    "content": company_name
                                }
                            }
                        ]
                    }
                }
            )
            
            company_id = new_company['id']
            logger.info(f"Created new company: {company_name} (ID: {company_id})")
            return company_id
            
        except APIResponseError as e:
            logger.error(f"Error finding/creating company: {e}")
            return None
    
    def create_job_posting(self, position: str, company: str, 
                          posting_url: str, origin: str = 'LinkedIn',
                          match: Optional[str] = None,
                          work_arrangement: Optional[str] = None,
                          demand: Optional[str] = None,
                          budget: Optional[float] = None,
                          job_description: Optional[str] = None,
                          city: Optional[str] = None,
                          country: Optional[str] = None) -> Dict:
        """Create new job posting entry in Notion database.
        
        Args:
            position: Job title
            company: Company name
            posting_url: LinkedIn URL
            origin: Source platform (default: LinkedIn)
            match: Match level (low/medium/high) - optional
            work_arrangement: Work arrangement (remote/hybrid/on-site) - optional
            demand: Company size (0-50/51-200/201-500/500+) - optional
            budget: Salary budget - optional
            job_description: Full job description text - will be added as page content
            city: City location - optional
            country: Country location - optional
            
        Returns:
            Created page object from Notion API
        """
        # Find or create company in Companies database
        company_id = self.find_or_create_company(company)
        
        properties = {
            "Position": {
                "title": [
                    {
                        "text": {
                            "content": position
                        }
                    }
                ]
            },
            "Posting URL": {
                "url": posting_url
            },
            "Source": {
                "select": {
                    "name": "LinkedIn"
                }
            },
            "Origin": {
                "select": {
                    "name": "Applied"
                }
            }
        }
        
        # Add Company as relation if we have a company_id
        if company_id:
            properties["Company"] = {
                "relation": [
                    {
                        "id": company_id
                    }
                ]
            }
        
        # Add optional fields if provided
        if match:
            properties["Match"] = {
                "select": {
                    "name": match
                }
            }
        
        if work_arrangement:
            properties["Work Arrangement"] = {
                "select": {
                    "name": work_arrangement
                }
            }
        
        if demand:
            properties["Demand"] = {
                "select": {
                    "name": demand
                }
            }
        
        if budget is not None:
            properties["Budget"] = {
                "number": budget
            }
        
        # City is multi_select, not rich_text
        if city:
            properties["City"] = {
                "multi_select": [
                    {
                        "name": city
                    }
                ]
            }
        
        if country:
            properties["Country"] = {
                "select": {
                    "name": country
                }
            }
        
        logger.info(f"Creating Notion page for: {position} at {company}")
        
        # Prepare page content (children) for job description
        children = []
        if job_description:
            # Place job description inside a callout block
            # Split into 2000-char chunks for each rich_text item
            description_chunks = [job_description[i:i+2000] 
                                for i in range(0, len(job_description), 2000)]
            
            children.append({
                "object": "block",
                "type": "callout",
                "callout": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": chunk
                            }
                        }
                        for chunk in description_chunks
                    ],
                    "icon": {
                        "type": "external",
                        "external": {
                            "url": "https://www.notion.so/icons/description_gray.svg"
                        }
                    },
                    "color": "default"
                }
            })
        
        try:
            # Create page without template (set icon and children directly)
            page_data = {
                "parent": {"database_id": self.database_id},
                "icon": {
                    "type": "external",
                    "external": {
                        "url": "https://www.notion.so/icons/share_gray.svg"
                    }
                },
                "properties": properties
            }
            
            # Add children (page content) if we have job description
            if children:
                page_data["children"] = children
            
            response = self.client.pages.create(**page_data)
            
            return response
        except APIResponseError as e:
            logger.error(f"Error creating Notion page: {e}")
            raise
    
    def update_job_posting(self, page_id: str, position: str, company: str, 
                          posting_url: str, origin: str = 'LinkedIn',
                          match: Optional[str] = None,
                          work_arrangement: Optional[str] = None,
                          demand: Optional[str] = None,
                          budget: Optional[float] = None,
                          job_description: Optional[str] = None,
                          city: Optional[str] = None,
                          country: Optional[str] = None) -> Dict:
        """Update existing job posting entry in Notion database.
        
        Args:
            page_id: Notion page ID to update
            position: Job title
            company: Company name
            posting_url: LinkedIn URL
            origin: Source platform (default: LinkedIn)
            match: Match level (low/medium/high) - optional
            work_arrangement: Work arrangement (remote/hybrid/on-site) - optional
            demand: Company size (0-50/51-200/201-500/500+) - optional
            budget: Salary budget - optional
            job_description: Full job description text - will update page content
            city: City location - optional
            country: Country location - optional
            
        Returns:
            Updated page object from Notion API
        """
        # Find or create company in Companies database
        company_id = self.find_or_create_company(company)
        
        properties = {
            "Position": {
                "title": [
                    {
                        "text": {
                            "content": position
                        }
                    }
                ]
            },
            "Posting URL": {
                "url": posting_url
            },
            "Source": {
                "select": {
                    "name": "LinkedIn"
                }
            },
            "Origin": {
                "select": {
                    "name": "Applied"
                }
            }
        }
        
        # Add Company as relation if we have a company_id
        if company_id:
            properties["Company"] = {
                "relation": [
                    {
                        "id": company_id
                    }
                ]
            }
        
        # Add optional fields if provided
        if match:
            properties["Match"] = {
                "select": {
                    "name": match
                }
            }
        
        if work_arrangement:
            properties["Work Arrangement"] = {
                "select": {
                    "name": work_arrangement
                }
            }
        
        if demand:
            properties["Demand"] = {
                "select": {
                    "name": demand
                }
            }
        
        if budget is not None:
            properties["Budget"] = {
                "number": budget
            }
        
        # City is multi_select, not rich_text
        if city:
            properties["City"] = {
                "multi_select": [
                    {
                        "name": city
                    }
                ]
            }
        
        if country:
            properties["Country"] = {
                "select": {
                    "name": country
                }
            }
        
        logger.info(f"Updating Notion page: {page_id}")
        
        try:
            # Update page properties
            response = self.client.pages.update(
                page_id=page_id,
                properties=properties
            )
            
            # If job description provided, update page content
            if job_description:
                # First, get existing blocks to delete them
                blocks_response = self.client.blocks.children.list(block_id=page_id)
                existing_blocks = blocks_response.get('results', [])
                
                # Delete existing blocks
                for block in existing_blocks:
                    try:
                        self.client.blocks.delete(block_id=block['id'])
                    except APIResponseError as e:
                        logger.warning(f"Could not delete block {block['id']}: {e}")
                
                # Add new job description in callout block
                description_chunks = [job_description[i:i+2000] 
                                    for i in range(0, len(job_description), 2000)]
                
                self.client.blocks.children.append(
                    block_id=page_id,
                    children=[{
                        "object": "block",
                        "type": "callout",
                        "callout": {
                            "rich_text": [
                                {
                                    "type": "text",
                                    "text": {
                                        "content": chunk
                                    }
                                }
                                for chunk in description_chunks
                            ],
                            "icon": {
                                "type": "external",
                                "external": {
                                    "url": "https://www.notion.so/icons/description_gray.svg"
                                }
                            },
                            "color": "default"
                        }
                    }]
                )
            
            return response
        except APIResponseError as e:
            logger.error(f"Error updating Notion page: {e}")
            raise
