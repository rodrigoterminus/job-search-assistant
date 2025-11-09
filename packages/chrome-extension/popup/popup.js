/**
 * Job Posting Collector - Popup Logic
 * Handles form display, data extraction, validation, and save functionality
 */

const BACKEND_URL = 'http://localhost:3000';

// DOM Elements
const statusEl = document.getElementById('status');
const formEl = document.getElementById('job-form');
const saveBtn = document.getElementById('save-btn');
const openBtn = document.getElementById('open-btn');
const errorEl = document.getElementById('error');
const successEl = document.getElementById('success');

// Form field elements
const fields = {
  position: document.getElementById('position'),
  company: document.getElementById('company'),
  posting_url: document.getElementById('posting_url'),
  match: document.getElementById('match'),
  work_arrangement: document.getElementById('work_arrangement'),
  demand: document.getElementById('demand'),
  budget: document.getElementById('budget'),
  city: document.getElementById('city'),
  country: document.getElementById('country')
};

// Hidden field: job_description is extracted but not displayed in UI
let extractedJobDescription = null;

// State for existing job posting
let existingPageId = null;
let existingPageUrl = null;

/**
 * Ensure content script is loaded on the current tab
 * Injects content script if not already loaded (e.g., extension just installed or reloaded)
 */
async function ensureContentScriptLoaded() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    // Try to ping the content script
    await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
    console.log('[Popup] Content script already loaded');
  } catch (error) {
    // Content script not loaded, inject it
    console.log('[Popup] Content script not loaded, injecting...');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/content_script.js']
    });
    console.log('[Popup] Content script injected successfully');
  }
}

/**
 * Initialize checkbox state from storage
 * Loads user preference for LinkedIn auto-save (default: true)
 */
async function initializeCheckbox() {
  const { saveToLinkedIn = true } = await chrome.storage.local.get({ saveToLinkedIn: true });
  const checkbox = document.getElementById('save-to-linkedin');
  if (checkbox) {
    checkbox.checked = saveToLinkedIn;
    console.log('[Popup] Checkbox initialized to:', saveToLinkedIn);
  }
}

/**
 * Check if job posting already exists in Notion
 */
async function checkJobExists(postingUrl) {
  console.log('[Popup] Checking if job exists:', postingUrl);
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/job-postings/check?posting_url=${encodeURIComponent(postingUrl)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn('[Popup] Check request failed:', response.status);
      return { exists: false };
    }
    
    const data = await response.json();
    console.log('[Popup] Check response:', data);
    return data;
  } catch (error) {
    console.error('[Popup] Check error:', error);
    return { exists: false };
  }
}

/**
 * Open existing job posting in Notion
 */
function openOnNotion() {
  if (existingPageUrl) {
    console.log('[Popup] Opening Notion page:', existingPageUrl);
    chrome.tabs.create({ url: existingPageUrl });
  }
}

/**
 * Update button states based on whether job exists
 */
function updateButtonStates(exists) {
  if (exists) {
    // Job exists - enable "Open on Notion" + change label to "Update in Notion"
    openBtn.disabled = false;
    saveBtn.textContent = 'Update in Notion';
    console.log('[Popup] Buttons configured for existing job (update mode)');
  } else {
    // Job doesn't exist - disable "Open on Notion" + label as "Save to Notion"
    openBtn.disabled = true;
    saveBtn.textContent = 'Save to Notion';
    console.log('[Popup] Buttons configured for new job (create mode)');
  }
}

/**
 * Update status message
 */
function setStatus(message, type = 'normal') {
  statusEl.textContent = message;
  statusEl.className = 'status';
  if (type === 'loading') statusEl.classList.add('loading');
  if (type === 'success') statusEl.classList.add('success');
  console.log('[Popup] Status:', message, '(' + type + ')');
}

/**
 * Show error message
 */
function showError(message) {
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  successEl.style.display = 'none';
  console.error('[Popup] Error:', message);
}

/**
 * Show success message
 */
function showSuccess(message) {
  successEl.textContent = message;
  successEl.style.display = 'block';
  errorEl.style.display = 'none';
  console.log('[Popup] Success:', message);
}

/**
 * Hide messages
 */
function hideMessages() {
  errorEl.style.display = 'none';
  successEl.style.display = 'none';
}

/**
 * Check if current tab is a LinkedIn job page
 */
async function isLinkedInJobPage() {
  console.log('[Popup] Checking if current tab is LinkedIn job page...');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isJobPage = tab.url && (
    tab.url.includes('linkedin.com/jobs/view') ||
    tab.url.includes('linkedin.com/jobs/collections') ||
    tab.url.includes('linkedin.com/jobs/search')
  );
  console.log('[Popup] Is LinkedIn job page:', isJobPage, 'URL:', tab.url);
  return isJobPage;
}

/**
 * Scrape job data from current LinkedIn page
 * Sends message to content script to extract job data
 */
async function scrapeJobData() {
  console.log('[Popup] Starting job data extraction...');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    const result = await chrome.tabs.sendMessage(tab.id, {
      action: 'scrapeJobData'
    });
    
    if (result && result.position) {
      console.log('[Popup] Extraction successful:', result);
      return result;
    }
    
    console.error('[Popup] Extraction failed - incomplete data returned');
    throw new Error('Failed to scrape job data');
  } catch (error) {
    console.error('[Popup] Extraction error:', error);
    throw error;
  }
}

/**
 * Pre-fill form with scraped data
 */
function prefillForm(jobData) {
  console.log('[Popup] Pre-filling form with extracted data...');
  
  // Check for extraction failures on required fields
  const failures = [];
  
  if (jobData.position) {
    fields.position.value = jobData.position;
    console.log('[Popup] Pre-filled position:', jobData.position);
  } else {
    failures.push('Position');
  }
  
  if (jobData.company) {
    fields.company.value = jobData.company;
    console.log('[Popup] Pre-filled company:', jobData.company);
  } else {
    failures.push('Company');
  }
  
  if (jobData.posting_url) {
    fields.posting_url.value = jobData.posting_url;
    console.log('[Popup] Pre-filled posting_url:', jobData.posting_url);
  }
  
  // Show warnings for failed extractions
  if (failures.length > 0) {
    const warningMsg = 'Auto-extraction failed for: ' + failures.join(', ') + '. Please enter manually.';
    showError(warningMsg);
    console.warn('[Popup] Extraction failures:', failures);
  }
  
  // Optional fields - no warnings if missing
  if (jobData.match) fields.match.value = jobData.match;
  if (jobData.work_arrangement) fields.work_arrangement.value = jobData.work_arrangement;
  if (jobData.demand) fields.demand.value = jobData.demand;
  if (jobData.budget) fields.budget.value = jobData.budget;
  if (jobData.city) {
    fields.city.value = jobData.city;
    console.log('[Popup] Pre-filled city:', jobData.city);
  }
  if (jobData.country) {
    fields.country.value = jobData.country;
    console.log('[Popup] Pre-filled country:', jobData.country);
  }
  
  // Store job description (not displayed in UI, but sent to backend)
  if (jobData.job_description) {
    extractedJobDescription = jobData.job_description;
    console.log('[Popup] Stored job description (' + extractedJobDescription.length + ' chars) for backend submission');
  }
  
  console.log('[Popup] Form pre-fill complete');
}

/**
 * Get form data for submission
 */
function getFormData() {
  const data = {
    position: fields.position.value.trim(),
    company: fields.company.value.trim(),
    posting_url: fields.posting_url.value.trim(),
    origin: 'LinkedIn'
  };
  
  // Add page_id if updating existing job
  if (existingPageId) {
    data.page_id = existingPageId;
  }
  
  // Add optional visible fields if they have values
  if (fields.match.value) data.match = fields.match.value;
  if (fields.work_arrangement.value) data.work_arrangement = fields.work_arrangement.value;
  if (fields.demand.value) data.demand = fields.demand.value;
  if (fields.budget.value) data.budget = parseFloat(fields.budget.value);
  if (fields.city.value.trim()) data.city = fields.city.value.trim();
  if (fields.country.value.trim()) data.country = fields.country.value.trim();
  
  // Add job description (extracted, not displayed in UI)
  // Formatting is preserved as extracted from LinkedIn
  if (extractedJobDescription) {
    data.job_description = extractedJobDescription;
  }
  
  console.log('[Popup] Collected form data:', {
    ...data,
    job_description: data.job_description ? data.job_description.length + ' chars' : 'none',
    page_id: data.page_id || 'none (new job)'
  });
  
  return data;
}

/**
 * Validate required fields
 */
function validateForm() {
  const position = fields.position.value.trim();
  const company = fields.company.value.trim();
  const posting_url = fields.posting_url.value.trim();
  
  const isValid = position && company && posting_url;
  console.log('[Popup] Form validation:', {
    position: position ? 'OK' : 'MISSING',
    company: company ? 'OK' : 'MISSING',
    posting_url: posting_url ? 'OK' : 'MISSING',
    isValid
  });
  
  return isValid;
}

/**
 * Update save button state based on validation
 */
function updateSaveButton() {
  const isValid = validateForm();
  saveBtn.disabled = !isValid;
  
  if (!isValid) {
    console.log('[Popup] Save button disabled - required fields missing');
  }
}

/**
 * Click LinkedIn save button via content script
 * Sends message to content script with 3-second timeout
 * @returns {Promise<Object>} Response with success status and reason
 */
async function clickLinkedInSaveButton() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    // Apply 3-second timeout to LinkedIn click (advisory)
    const clickPromise = chrome.tabs.sendMessage(tab.id, {
      action: 'clickLinkedInSave'
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 3000)
    );
    
    const response = await Promise.race([clickPromise, timeoutPromise]);
    console.log('[Popup] LinkedIn click response:', response);
    return response;
  } catch (error) {
    console.warn('[Popup] LinkedIn click error:', error);
    return { 
      success: false, 
      reason: error.message === 'timeout' ? 'timeout' : 'error',
      message: error.message
    };
  }
}

/**
 * Check LinkedIn login state via content script
 * Disables checkbox if user is not logged into LinkedIn
 */
async function checkLoginState() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'checkLinkedInLoginState'
    });
    
    const checkbox = document.getElementById('save-to-linkedin');
    const label = checkbox ? checkbox.parentElement : null;
    
    if (checkbox && label && !response.loggedIn) {
      checkbox.disabled = true;
      label.classList.add('disabled');
      console.log('[Popup] Checkbox disabled - user not logged in to LinkedIn');
    }
  } catch (error) {
    // Content script not loaded or not on LinkedIn; leave checkbox enabled
    console.warn('[Popup] Could not check login state:', error);
  }
}

// Add input event listeners to validate on change
fields.position.addEventListener('input', updateSaveButton);
fields.company.addEventListener('input', updateSaveButton);
fields.posting_url.addEventListener('input', updateSaveButton);

// Add checkbox change listener to save preference
document.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.getElementById('save-to-linkedin');
  if (checkbox) {
    checkbox.addEventListener('change', async (e) => {
      await chrome.storage.local.set({ saveToLinkedIn: e.target.checked });
      console.log('[Popup] Preference saved: saveToLinkedIn =', e.target.checked);
    });
  }
});

// Add click event listener for "Open on Notion" button
openBtn.addEventListener('click', openOnNotion);

/**
 * Save job to Notion via Flask backend
 */
async function saveJobToNotion(jobData) {
  console.log('[Popup] Sending data to backend:', jobData);
  console.log('[Popup] Backend URL:', BACKEND_URL);
  
  try {
    console.log('[Popup] Initiating fetch request...');
    const response = await fetch(`${BACKEND_URL}/api/job-postings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobData)
    });
    
    console.log('[Popup] Fetch completed');
    console.log('[Popup] Backend response status:', response.status);
    console.log('[Popup] Response headers:', [...response.headers.entries()]);
    
    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type');
    console.log('[Popup] Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error('[Popup] Response is not JSON. Content-Type:', contentType);
      // Try to read response as text for debugging
      const text = await response.text();
      console.error('[Popup] Response body:', text);
      throw new Error('Backend server returned invalid response. Check server logs.');
    }
    
    const data = await response.json();
    console.log('[Popup] Backend response:', response.status, data);
    
    if (!response.ok) {
      // Handle specific error types
      if (response.status === 429) {
        // Rate limit
        throw new Error('Notion API rate limit reached. Retry in 5 seconds?');
      } else if (response.status === 504) {
        // Timeout
        throw new Error('Notion API timeout. Would you like to retry?');
      } else if (response.status === 401) {
        // Auth error
        throw new Error('Failed to connect to Notion. Check API credentials and retry.');
      } else {
        throw new Error(data.error || 'Failed to save job posting');
      }
    }
    
    return data;
  } catch (error) {
    console.error('[Popup] Caught error:', error);
    console.error('[Popup] Error name:', error.name);
    console.error('[Popup] Error message:', error.message);
    console.error('[Popup] Error stack:', error.stack);
    
    // Network error (backend not reachable)
    if (error.message.includes('Failed to fetch') || error instanceof TypeError) {
      console.error('[Popup] Backend unreachable - network error');
      throw new Error('Backend server not running. Please start Flask server (see setup docs)');
    }
    throw error;
  }
}

/**
 * Handle form submission
 */
formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();
  
  saveBtn.disabled = true;
  setStatus('Saving to Notion...', 'loading');
  
  console.log('[Popup] Form submission started');
  
  try {
    const jobData = getFormData();
    
    // 1. Save to Notion (always happens - critical operation)
    const result = await saveJobToNotion(jobData);
    
    // 2. Click LinkedIn button if enabled (best-effort, non-blocking)
    const { saveToLinkedIn = true } = await chrome.storage.local.get({ saveToLinkedIn: true });
    
    if (saveToLinkedIn) {
      clickLinkedInSaveButton().catch(err => {
        console.warn('[Popup] LinkedIn click failed (non-critical):', err);
        // Gracefully ignore - Notion save succeeded
      });
    }
    
    const isUpdate = !!existingPageId;
    const successMessage = isUpdate ? 'Job updated in Notion!' : 'Job saved to Notion!';
    
    setStatus(successMessage, 'success');
    showSuccess(`${successMessage} View: ${result.notion_page_url}`);
    
    console.log('[Popup] Save successful:', result);
    
    // Update state and button after successful save/update
    if (!isUpdate) {
      // New job was created, update to show as existing
      existingPageId = result.notion_page_id;
      existingPageUrl = result.notion_page_url;
      updateButtonStates(true);
    }
  } catch (error) {
    console.error('[Popup] Save error:', error);
    setStatus('Ready to save', 'normal');
    showError(error.message || 'Failed to save job posting');
  } finally {
    saveBtn.disabled = false;
  }
});

/**
 * Initialize popup on load
 */
(async () => {
  console.log('[Popup] Initializing...');
  
  // Initialize checkbox preference
  await initializeCheckbox();
  
  try {
    const isJobPage = await isLinkedInJobPage();
    
    if (!isJobPage) {
      setStatus('Not a LinkedIn job page');
      formEl.style.display = 'none';
      showError('Please navigate to a LinkedIn job posting to use this extension');
      console.log('[Popup] Initialization stopped - not on LinkedIn job page');
      return;
    }
    
    // Ensure content script is loaded
    await ensureContentScriptLoaded();
    
    // Check login state and disable checkbox if needed
    await checkLoginState();
    
    setStatus('Extracting job data...', 'loading');
    const scrapedData = await scrapeJobData();
    
    prefillForm(scrapedData);
    
    // Check if job already exists in Notion
    if (scrapedData.posting_url) {
      setStatus('Checking Notion...', 'loading');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Checking...';
      
      const checkResult = await checkJobExists(scrapedData.posting_url);
      
      if (checkResult.exists) {
        existingPageId = checkResult.page_id;
        existingPageUrl = checkResult.page_url;
        updateButtonStates(true);
        setStatus('Job already saved - review and update if needed');
        console.log('[Popup] Existing job found:', existingPageId);
      } else {
        updateButtonStates(false);
        setStatus('Review and save job posting');
        console.log('[Popup] New job - ready to save');
      }
    } else {
      updateButtonStates(false);
      setStatus('Review and save job posting');
    }
    
    updateSaveButton();
    
    console.log('[Popup] Initialization complete');
    
  } catch (error) {
    console.error('[Popup] Initialization error:', error);
    setStatus('Error extracting data');
    showError('Could not extract job data. You can still manually fill the form.');
    updateButtonStates(false);
    updateSaveButton();
  }
})();
