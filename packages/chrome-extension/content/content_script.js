/**
 * LinkedIn job posting scraper
 * Extracts job data from LinkedIn job pages
 * Note: Job description formatting is preserved for Notion rich text field
 */

function scrapeLinkedInJob() {
  console.log('[Content Script] Starting LinkedIn job scraping...');
  
  const result = {
    position: null,
    company: null,
    posting_url: window.location.href,
    origin: 'LinkedIn',
    job_description: null,
    match: null,
    work_arrangement: null,
    demand: null,
    budget: null,
    city: null,
    country: null
  };
  
  // Extract job title
  // Primary selector: h1 with job title class
  const titleSelectors = [
    'h1.top-card-layout__title',
    '[data-job-title]',
    'h1.jobs-unified-top-card__job-title',
    'h1.t-24'
  ];
  
  for (const selector of titleSelectors) {
    const titleElement = document.querySelector(selector);
    if (titleElement && titleElement.textContent.trim()) {
      result.position = titleElement.textContent.trim();
      console.log('[Content Script] Extracted position:', result.position);
      break;
    }
  }
  
  // Extract company name
  // Primary selector: company link in top card
  const companySelectors = [
    '.job-details-jobs-unified-top-card__company-name a',
    'a.job-details-jobs-unified-top-card__company-name',
    'a.topcard__org-name-link',
    '.topcard__flavor--black-link',
    'a.jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__subtitle-primary-grouping a'
  ];
  
  for (const selector of companySelectors) {
    const companyElement = document.querySelector(selector);
    if (companyElement && companyElement.textContent.trim()) {
      result.company = companyElement.textContent.trim();
      console.log('[Content Script] Extracted company:', result.company);
      break;
    }
  }
  
  // Extract job description
  // Preserve formatting by using innerHTML to keep structure
  const descriptionSelectors = [
    '.jobs-description__content',
    '.jobs-box__html-content',
    '[class*="description"]',
    '.jobs-description'
  ];
  
  for (const selector of descriptionSelectors) {
    const descriptionElement = document.querySelector(selector);
    if (descriptionElement) {
      // Get text content (formatting will be handled by Notion API)
      // Preserve line breaks and basic structure
      result.job_description = descriptionElement.innerText || descriptionElement.textContent;
      if (result.job_description) {
        console.log('[Content Script] Extracted job description (' + result.job_description.length + ' chars)');
        break;
      }
    }
  }
  
  // Extract work arrangement from job details
  const workArrangementElement = document.querySelector('.job-details-fit-level-preferences');
  if (workArrangementElement) {
    const text = workArrangementElement.textContent.trim().toLowerCase();
    if (text.includes('remote')) {
      result.work_arrangement = 'remote';
      console.log('[Content Script] Extracted work_arrangement: remote');
    } else if (text.includes('hybrid')) {
      result.work_arrangement = 'hybrid';
      console.log('[Content Script] Extracted work_arrangement: hybrid');
    } else if (text.includes('on-site') || text.includes('onsite') || text.includes('on site')) {
      result.work_arrangement = 'on-site';
      console.log('[Content Script] Extracted work_arrangement: on-site');
    }
  }
  
  // Extract demand (number of applicants)
  const applicantElement = document.querySelector('.jobs-premium-applicant-insights__list-num');
  if (applicantElement) {
    const applicantText = applicantElement.textContent.trim();
    const applicantMatch = applicantText.match(/(\d+)/);
    if (applicantMatch) {
      const numApplicants = parseInt(applicantMatch[1], 10);
      // Map to demand categories
      if (numApplicants <= 50) {
        result.demand = '0-50';
      } else if (numApplicants <= 200) {
        result.demand = '51-200';
      } else if (numApplicants <= 500) {
        result.demand = '201-500';
      } else {
        result.demand = '500+';
      }
      console.log('[Content Script] Extracted demand: ' + result.demand + ' (from ' + numApplicants + ' applicants)');
    }
  }
  
  // Extract city from primary description container
  const primaryDescriptionContainer = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container');
  if (primaryDescriptionContainer) {
    const cityElement = primaryDescriptionContainer.querySelector('.tvm__text');
    if (cityElement) {
      const cityText = cityElement.textContent.trim();
      // Extract city - it might be "City, State" or just "City"
      if (cityText.includes(',')) {
        result.city = cityText.split(',')[0].trim();
      } else {
        result.city = cityText;
      }
      console.log('[Content Script] Extracted city:', result.city);
    }
  }
  
  // Extract country from location information (fallback if not found in city extraction)
  const locationSelectors = [
    '.jobs-unified-top-card__bullet',
    '.topcard__flavor--bullet',
    '.jobs-unified-top-card__workplace-type'
  ];
  
  for (const selector of locationSelectors) {
    const locationElements = document.querySelectorAll(selector);
    for (const locElement of locationElements) {
      const text = locElement.textContent.trim();
      // Check if this looks like a location (contains comma or known city/country patterns)
      if (text && text.includes(',')) {
        const parts = text.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          // Only set city if not already found from primary description
          if (!result.city) {
            result.city = parts[0];
          }
          result.country = parts[parts.length - 1];
          console.log('[Content Script] Extracted location from bullets: City=' + result.city + ', Country=' + result.country);
          break;
        }
      }
    }
    if (result.country) break;
  }
  
  console.log('[Content Script] Scraping complete. Result:', {
    position: result.position ? 'Found' : 'Not found',
    company: result.company ? 'Found' : 'Not found',
    posting_url: result.posting_url,
    job_description: result.job_description ? result.job_description.length + ' chars' : 'Not found',
    work_arrangement: result.work_arrangement || 'Not found',
    demand: result.demand || 'Not found',
    city: result.city || 'Not found',
    country: result.country || 'Not found'
  });
  
  return result;
}

/**
 * Find LinkedIn save button using multiple selector fallbacks
 * Tries multiple CSS selectors to handle LinkedIn DOM changes
 * @returns {HTMLElement|null} Save button element or null if not found
 */
function findLinkedInSaveButton() {
  console.log('[Content Script] Searching for LinkedIn save button...');
  
  // Fallback selectors in priority order
  const selectors = [
    'button[aria-label*="Save"]',      // ARIA label (most reliable)
    'button.jobs-save-button',         // LinkedIn's job save button class
    'button[data-control-name*="save"]', // Data attribute matching
  ];
  
  for (const selector of selectors) {
    const button = document.querySelector(selector);
    if (button) {
      console.log('[Content Script] Save button found with selector:', selector);
      return button;
    }
  }
  
  console.log('[Content Script] Save button not found');
  return null;
}

/**
 * Check if job is already saved on LinkedIn
 * @param {HTMLElement} button - The save button element
 * @returns {boolean} True if job already saved, false otherwise
 */
function isJobAlreadySaved(button) {
  const text = (button.textContent || button.innerText || '').toLowerCase();
  const alreadySaved = text.includes('saved');
  console.log('[Content Script] Button text:', text, '| Already saved:', alreadySaved);
  return alreadySaved;
}

/**
 * Check if user is logged in to LinkedIn
 * Uses multiple DOM indicators to determine login state
 * @returns {Object} Login state with indicators array
 */
function isUserLoggedInToLinkedIn() {
  console.log('[Content Script] Checking LinkedIn login state...');
  
  // Common logged-in UI indicators
  const loginIndicators = [
    '.global-nav__me',                              // User profile nav item
    '.global-nav__me-photo',                        // User avatar image
    '[data-control-name="identity_profile_photo"]', // Profile photo element
  ];
  
  const detected = loginIndicators.filter(selector => 
    document.querySelector(selector) !== null
  );
  
  const loggedIn = detected.length > 0;
  console.log('[Content Script] Login indicators detected:', detected, '| Logged in:', loggedIn);
  
  return {
    loggedIn: loggedIn,
    indicators: detected
  };
}

/**
 * Handle clickLinkedInSave message from popup
 * Attempts to find and click LinkedIn's save button
 * @param {Function} sendResponse - Callback to send response to popup
 */
function handleClickLinkedInSave(sendResponse) {
  try {
    const button = findLinkedInSaveButton();
    
    if (!button) {
      sendResponse({ 
        success: false, 
        reason: 'button-not-found',
        message: 'LinkedIn save button not found'
      });
      return;
    }
    
    if (isJobAlreadySaved(button)) {
      sendResponse({ 
        success: true, 
        reason: 'already-saved',
        message: 'Job already saved on LinkedIn'
      });
      return;
    }
    
    button.click();
    console.log('[Content Script] LinkedIn save button clicked successfully');
    sendResponse({ 
      success: true, 
      reason: 'clicked',
      message: 'LinkedIn save button clicked'
    });
  } catch (error) {
    console.error('[Content Script] Error clicking LinkedIn button:', error);
    sendResponse({ 
      success: false, 
      reason: 'error',
      message: error.message
    });
  }
}

/**
 * Handle checkLinkedInLoginState message from popup
 * @param {Function} sendResponse - Callback to send response to popup
 */
function handleCheckLoginState(sendResponse) {
  const loginState = isUserLoggedInToLinkedIn();
  sendResponse(loginState);
}

/**
 * Handle scrapeJobData message from popup
 * @param {Function} sendResponse - Callback to send response to popup
 */
function handleScrapeJobData(sendResponse) {
  const jobData = scrapeLinkedInJob();
  sendResponse(jobData);
}

/**
 * Message listener for popup communication
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Content Script] Message received:', request.action);
  
  switch (request.action) {
    case 'ping':
      sendResponse({ status: 'ready' });
      return true;
      
    case 'clickLinkedInSave':
      handleClickLinkedInSave(sendResponse);
      return true; // Keep channel open for async response
      
    case 'checkLinkedInLoginState':
      handleCheckLoginState(sendResponse);
      return true;
      
    case 'scrapeJobData':
      handleScrapeJobData(sendResponse);
      return true;
      
    default:
      sendResponse({ error: 'Unknown action' });
      return false;
  }
});
