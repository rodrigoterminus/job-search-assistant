/**
 * LinkedIn job posting scraper
 * Extracts job data from LinkedIn job pages
 * Note: Job description formatting is preserved for Notion rich text field
 */

(function scrapeLinkedInJob() {
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
})();
