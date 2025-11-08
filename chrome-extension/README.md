# Job Posting Collector - Chrome Extension

Chrome extension for saving LinkedIn job postings to Notion with one click.

## Installation

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Navigate to and select the `chrome-extension/` folder
5. The extension should appear in your extensions list

### 2. Pin Extension to Toolbar (Optional)

1. Click the **Extensions** puzzle icon in Chrome toolbar
2. Find **Job Posting Collector** in the list
3. Click the **pin** icon to keep it visible

## Usage

### Save a Job Posting

1. Navigate to a LinkedIn job posting page
   - URL should be `https://www.linkedin.com/jobs/view/...` or `https://www.linkedin.com/jobs/collections/...`

2. Click the **Job Posting Collector** extension icon in your toolbar

3. Review the auto-filled form:
   - **Position** and **Company** are automatically extracted (required)
   - **Posting URL** is automatically filled but hidden (used behind the scenes)
   - Optional fields are organized in rows:
     - Row 1: Match Level + Work Arrangement
     - Row 2: Demand + Budget/Salary
     - Row 3: City + Country
   - These fields are auto-filled when available on LinkedIn
   - Edit any field as needed before saving

4. Click **Save to Notion**

5. Wait for confirmation message
   - Success: "Job saved to Notion! View: [Notion page URL]"
   - The popup will close automatically after 2 seconds

### Troubleshooting

**"Not a LinkedIn job page" error**
- Make sure you're on an actual job posting page, not the job search results
- URL must contain `/jobs/view/` or `/jobs/collections/`

**"Backend server not running" error**
- Start the Flask backend server (see backend/README.md)
- Verify it's running on http://localhost:5000

**"Auto-extraction failed" warning**
- LinkedIn page structure may have changed
- Manually enter the missing fields
- Save button is disabled until all required fields (Position, Company) have values
- Posting URL is automatically populated but hidden from view

**"Duplicate" error**
- The job posting URL already exists in your Notion database
- Click the provided link to view the existing entry
- You can edit the existing entry in Notion if needed

**Extraction not working**
- Refresh the LinkedIn page and try again
- Check browser console for errors (Right-click → Inspect → Console tab)
- LinkedIn may have changed their page structure - update selectors in content_script.js

## Development

### File Structure

```
chrome-extension/
├── manifest.json             # Extension configuration (Manifest V3)
├── popup/
│   ├── popup.html           # Extension popup UI
│   ├── popup.js             # Popup logic and API communication
│   └── popup.css            # Popup styling
├── content/
│   └── content_script.js    # LinkedIn DOM scraping logic
├── icons/
│   ├── icon16.png.txt      # 16x16 icon (placeholder - replace with actual PNG)
│   ├── icon48.png.txt      # 48x48 icon (placeholder - replace with actual PNG)
│   └── icon128.png.txt     # 128x128 icon (placeholder - replace with actual PNG)
└── README.md                # This file
```

### Debugging

**View popup console:**
1. Right-click extension icon
2. Select "Inspect popup"
3. Console tab shows all logs

**View content script console:**
1. Open LinkedIn job page
2. Right-click → "Inspect"
3. Console tab shows content script logs

**Common log prefixes:**
- `[Popup]` - Messages from popup.js
- `[Content Script]` - Messages from content_script.js

### Making Changes

1. Edit files in `chrome-extension/`
2. Save changes
3. Go to `chrome://extensions/`
4. Click the **reload** icon for Job Posting Collector
5. Test changes (may need to close/reopen popup or refresh LinkedIn page)

### Icons

Replace the placeholder `.txt` files with actual PNG images:
- `icon16.png` - 16×16 pixels
- `icon48.png` - 48×48 pixels
- `icon128.png` - 128×128 pixels

You can generate icons using online tools like [Favicon Generator](https://www.favicon-generator.org/).

## Features

✅ Auto-extract job title and company from LinkedIn  
✅ Auto-extract work arrangement (remote/hybrid/on-site) from job details  
✅ Auto-extract demand (number of applicants) when available  
✅ Auto-extract location (city, country) from job details  
✅ Hidden posting URL field (automatically populated)  
✅ Compact form layout with related fields grouped in rows  
✅ Editable form - review and modify before saving  
✅ Required field validation  
✅ Duplicate detection  
✅ Error handling with helpful messages  
✅ Console logging for debugging  

## Limitations

- Only works on LinkedIn job posting pages
- Work Arrangement extraction depends on `.job-details-fit-level-preferences` element
- Demand (applicants) extraction depends on `.jobs-premium-applicant-insights__list-num` element
- Some fields may require manual entry if LinkedIn's page structure changes
- Job Description is extracted but not displayed (sent to Notion behind the scenes)
- Chrome only (uses Manifest V3)

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify the backend Flask server is running
3. Ensure Notion credentials are configured correctly
4. See [quickstart guide](../specs/001-job-posting-collector/quickstart.md) for setup help
