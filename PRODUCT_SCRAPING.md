# Product Scraping Chrome Extension

This Chrome extension automatically scrapes product links from supported e-commerce search result pages.

## Supported Sites

- **Amazon** (`amazon.com/s*`) - Extracts product links from search results
- **Noon** (`noon.com/*`) - Extracts product links from ANY Noon page (search, product, category, home)
- **IKEA** (`ikea.com/*/search*`) - Extracts product links from search results

## Features

### 1. URL Monitoring
- Automatically detects when user navigates to supported pages
- Monitors URL changes for SPA (Single Page Application) navigation
- Uses `window.location.href` monitoring with 500ms polling interval

### 2. Data Extraction
- Extracts all product detail page URLs currently displayed
- Supports infinite scroll pages by watching for newly added product nodes
- Uses `MutationObserver` to detect DOM changes

### 3. Deduplication
- Stores links in a `Set` to avoid duplicates
- Maintains unique product URLs across page loads and infinite scroll

### 4. Real-time Processing
- Automatically extracts products when page loads
- Continuously monitors for new products during infinite scroll
- Sends extracted data to background script for processing

### 5. Auto-Stop After CSV Download
- Automatically stops scraping after CSV file is downloaded
- Prevents continuous background processing
- Can be resumed manually if needed

## Implementation Details

### Content Script Architecture

The product scraping functionality is implemented in `src/contentScript/utils/productScraper.ts`:

```typescript
class ProductScraper {
  private productUrls: Set<string> = new Set();
  private observer: MutationObserver | null = null;
  private isInitialized = false;
}
```

### Key Methods

- `initialize()` - Sets up URL monitoring and MutationObserver
- `extractProducts()` - Extracts product URLs from current page
- `getAllProducts()` - Returns all extracted product URLs
- `stopScraping()` - Stops URL monitoring and mutation observer
- `resumeScraping()` - Restarts URL monitoring and mutation observer
- `destroy()` - Cleanup resources

### Site-Specific Selectors

#### Amazon
```javascript
const selectors = [
  'a[href*="/dp/"]',
  'a[href*="/gp/product/"]', 
  'h2 a',
  '[data-component-type="s-search-result"] h2 a',
  '.s-result-item h2 a',
  'a[href*="amazon.com/dp/"]'
];
```

#### Noon
```javascript
const selectors = [
  'a[href*="/p/"]',
  'a[href*="/uae-en/p/"]',
  '[data-testid*="product"] a',
  '.productContainer a',
  '[data-qa*="product"] a',
  'a[href*="noon.com/p/"]',
  '.product a',
  '[class*="product"] a'
];
```

#### IKEA
```javascript
const selectors = [
  'a[href*="/products/"]',
  'a[href*="/p/"]',
  '.product a',
  '[data-testid*="product"] a'
];
```

## Usage

### Automatic Extraction
The extension automatically starts scraping when you visit supported pages:

1. Navigate to any supported page
2. The extension detects the page and starts monitoring
3. Product links are automatically extracted and logged to console
4. Data is sent to background script for processing

### Manual Extraction
You can also trigger manual extraction by clicking the extension icon and using the scrape button.

### CSV Export
- Automatically generates CSV file with product data
- Downloads to your Downloads folder
- Stops scraping after CSV download to prevent continuous processing

### Console Output
The extension logs detailed information to the browser console:

```
Found 15 new product links from noon: [...]
Products extracted from content script: {...}
Scraping stopped after CSV download
```

## Testing

### Test Script
A test script is provided at `test-scraper.js` that can be run in the browser console:

```javascript
// Load the test script
// Then run:
testProductScraper();
```

### Expected Output
```javascript
{
  site: "Noon",
  totalLinks: 15,
  links: [
    {
      url: "https://www.noon.com/uae-en/product-name/N123456789/p/",
      title: "Product Title",
      selector: "a[href*=\"/p/\"]"
    }
    // ... more products
  ]
}
```

## Configuration

### Manifest Permissions
The extension requires the following permissions:

```json
{
  "content_scripts": [
    {
      "matches": [
        "*://www.amazon.com/s*",
        "*://www.noon.com/uae-en/*",
        "*://www.ikea.com/*"
      ],
      "js": ["contentScript.js"],
      "run_at": "document_idle"
    }
  ],
  "host_permissions": [
    "https://www.amazon.com/*",
    "https://www.noon.com/uae-en/*",
    "https://www.ikea.com/*"
  ]
}
```

### Background Script Integration
The background script receives extracted products via messages:

```javascript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PRODUCTS_EXTRACTED') {
    console.log('Products extracted:', msg.data);
    // Process the extracted products
  }
});
```

## Data Format

### ProductLink Interface
```typescript
interface ProductLink {
  url: string;        // Full product URL
  title: string;      // Product title (if available)
  source: 'amazon' | 'noon' | 'ikea';
}
```

### ScrapingResult Interface
```typescript
interface ScrapingResult {
  totalLinks: number;     // Total unique links found
  links: ProductLink[];   // New links found in this extraction
  source: string;         // Site name
  timestamp: number;      // Extraction timestamp
}
```

## Performance Considerations

- **Throttling**: URL monitoring uses 500ms polling to avoid excessive checks
- **Debouncing**: Product extraction is debounced to avoid excessive processing
- **Memory Management**: Uses Set for efficient deduplication
- **Auto-Stop**: Automatically stops after CSV download to save resources
- **Cleanup**: Properly disconnects MutationObserver on component unmount

## Browser Compatibility

- Chrome Extension Manifest V3
- Modern browsers with MutationObserver support
- ES6+ features (Sets, arrow functions, etc.)

## Troubleshooting

### Common Issues

1. **No products detected**: Check if you're on a supported page
2. **Console errors**: Check browser console for detailed error messages
3. **Extension not loading**: Verify manifest.json permissions and content script matches
4. **Scraping continues after CSV**: Extension should auto-stop, check console logs

### Debug Mode
Enable debug logging by opening browser DevTools and checking the console for detailed extraction logs.

## Future Enhancements

- Add support for more e-commerce sites
- Implement product data extraction (price, rating, etc.)
- Add data export functionality
- Implement rate limiting for API calls
- Add user preferences for extraction behavior
- Add manual resume/stop controls in UI
