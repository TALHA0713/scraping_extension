/**
 * Product Scraper Utility
 * Extracts product URLs from supported e-commerce sites
 */

export interface ProductLink {
  url: string;
  title: string;
  source: 'amazon' | 'noon' | 'ikea';
}

class ProductScraper {
  private productUrls: Set<string> = new Set();
  private observer: MutationObserver | null = null;
  private isInitialized = false;

  /**
   * Initialize the product scraper
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    // Don't auto-extract on initialization
    // User must click the scrape button
  }


  /**
   * Check if current URL is a search page
   */
  private isSearchPage(url: string = window.location.href): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const pathname = urlObj.pathname;

      // Check for Amazon search page
      if (hostname.includes('amazon.com') && pathname.includes('/s')) {
        return true;
      }

      // Check for Noon search page
      if (hostname.includes('noon.com') && pathname.includes('/search')) {
        return true;
      }

      // Check for IKEA search page
      if (hostname.includes('ikea.') && pathname.includes('/search')) {
        return true;
      }

      return false;
    } catch (error) {
      console.log('Error parsing URL:', error);
      return false;
    }
  }

  /**
   * Get current site
   */
  private getCurrentSite(): 'amazon' | 'noon' | 'ikea' | null {
    const hostname = window.location.hostname;
    if (hostname.includes('amazon.com')) return 'amazon';
    if (hostname.includes('noon.com')) return 'noon';
    if (hostname.includes('ikea.')) return 'ikea';
    return null;
  }

  /**
   * Setup MutationObserver to watch for DOM changes (pagination/infinite scroll)
   */
  private setupMutationObserver(): void {
    if (!this.isSearchPage()) {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      let shouldExtract = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (this.containsProductLinks(element)) {
                shouldExtract = true;
              }
            }
          });
        }
      });

      if (shouldExtract) {
        console.log('New products detected, extracting...');
        this.extractProducts();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Check if an element contains product links
   */
  private containsProductLinks(element: Element): boolean {
    const site = this.getCurrentSite();
    if (!site) return false;
    const selectors = this.getSelectorsForSite(site);
    return selectors.some(selector => element.querySelector(selector) !== null);
  }

  /**
   * Extract product URLs from search page
   */
  private extractProducts(): void {
    console.log('🔍 Starting product extraction...');

    if (!this.isSearchPage()) {
      console.log('❌ Not on search page, skipping extraction');
      return;
    }

    const site = this.getCurrentSite();
    if (!site) {
      console.log('❌ Could not determine site');
      return;
    }

    console.log(`✅ Extracting products from: ${site}`);
    const selectors = this.getSelectorsForSite(site);
    console.log(`📍 Using selectors:`, selectors);

    const newLinks: ProductLink[] = [];

    selectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      console.log(`🔎 Selector "${selector}" found ${links.length} elements`);

      links.forEach(link => {
        let href = link.getAttribute('href');

        // Special handling for IKEA: ensure we get the complete href
        if (site === 'ikea' && href) {
          // Try to get the absolute URL from the anchor element
          const anchorElement = link as HTMLAnchorElement;
          if (anchorElement.href) {
            // Use the browser's computed absolute href which should be complete
            href = anchorElement.href.replace(window.location.origin, '');
          }
        }

        if (href) {
          console.log(`🔗 Checking URL: ${href}`);
          if (this.isValidProductUrl(href, site)) {
            const fullUrl = this.normalizeUrl(href, site);
            console.log(`✓ Valid product URL: ${fullUrl}`);

            if (!this.productUrls.has(fullUrl)) {
              this.productUrls.add(fullUrl);
              newLinks.push({
                url: fullUrl,
                title: '',
                source: site
              });
            }
          } else {
            console.log(`✗ Invalid product URL (skipped): ${href}`);
          }
        }
      });
    });

    console.log(`✅ Extraction complete. Found ${newLinks.length} new products. Total: ${this.productUrls.size}`);
  }

  /**
   * Start scraping - called when user clicks the scrape button
   */
  public startScraping(): void {
    if (!this.isSearchPage()) {
      console.log('Not on a search page');
      return;
    }

    // Clear previous results
    this.productUrls.clear();

    // Setup mutation observer for pagination
    this.setupMutationObserver();

    // Extract initial products
    this.extractProducts();
  }

  /**
   * Get all extracted product URLs
   */
  public getAllProducts(): ProductLink[] {
    const site = this.getCurrentSite();
    const allUrls = Array.from(this.productUrls).map(url => ({
      url,
      title: '',
      source: site || 'amazon'
    }));

    // Apply filtering only for Amazon and only if we have more than 70 URLs
    if (site === 'amazon' && allUrls.length > 70) {
      console.log(`🔍 Filtering ${allUrls.length} URLs for Amazon (more than 70 detected)`);
      return this.filterUrlsByProduct(allUrls, site);
    }

    return allUrls;
  }

  
/**
 * Filter URLs by product to limit to 2-3 URLs per product (Amazon only)
 * If still >70, further reduce to 1 URL per product
 */
private filterUrlsByProduct(urls: ProductLink[], site: 'amazon'): ProductLink[] {
  const productGroups = new Map<string, ProductLink[]>();

  // Group URLs by product key
  urls.forEach(product => {
    const productKey = this.extractAmazonProductKey(product.url);
    if (!productGroups.has(productKey)) {
      productGroups.set(productKey, []);
    }
    productGroups.get(productKey)!.push(product);
  });

  console.log(`📊 Grouped ${urls.length} URLs into ${productGroups.size} products`);

  let filteredUrls: ProductLink[] = [];

  // Phase 1: keep up to 3 URLs per product
  productGroups.forEach((productUrls, productKey) => {
    const sortedUrls = this.prioritizeAmazonUrls(productUrls);
    const selectedUrls = sortedUrls.slice(0, 3);
    filteredUrls.push(...selectedUrls);
  });

  console.log(`🎯 Phase 1 done: reduced to ${filteredUrls.length} URLs`);

  // Phase 2: if still more than 70, keep only 1 URL per product
  if (filteredUrls.length > 70) {
    console.log(`⚙️ Still more than 70 URLs (${filteredUrls.length}), reducing to 1 per product...`);
    const onePerProduct: ProductLink[] = [];
    productGroups.forEach((productUrls, productKey) => {
      const sortedUrls = this.prioritizeAmazonUrls(productUrls);
      if (sortedUrls.length > 0) {
        onePerProduct.push(sortedUrls[0]);
      }
    });
    filteredUrls = onePerProduct;
    console.log(`✅ Phase 2 done: reduced to ${filteredUrls.length} URLs (1 per product)`);
  }

  console.log(`🏁 Final URL count: ${filteredUrls.length}`);
  return filteredUrls;
}

  /**
   * Extract Amazon product key from URL for grouping
   */
  private extractAmazonProductKey(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Extract product name from pathname
      // Example: /Smartphone-Unlocked-Processor-Manufacturer-Warranty/dp/B0DP3G4GVQ/
      const amazonPath = urlObj.pathname;
      const amazonMatch = amazonPath.match(/^\/([^\/]+)\/dp\//);
      if (amazonMatch) {
        return amazonMatch[1];
      }
      
      // Fallback: use the full pathname as key
      return urlObj.pathname;
    } catch (error) {
      console.warn('Error extracting Amazon product key from URL:', url, error);
      return url;
    }
  }

  /**
   * Prioritize Amazon URLs within a product group
   */
  private prioritizeAmazonUrls(urls: ProductLink[]): ProductLink[] {
    return urls.sort((a, b) => {
      const urlA = a.url.toLowerCase();
      const urlB = b.url.toLowerCase();
      
      // Prioritize main product pages (without complex ref parameters)
      const aHasSimpleRef = !urlA.includes('ref=') || urlA.includes('ref=sr_1_');
      const bHasSimpleRef = !urlB.includes('ref=') || urlB.includes('ref=sr_1_');
      
      if (aHasSimpleRef && !bHasSimpleRef) return -1;
      if (!aHasSimpleRef && bHasSimpleRef) return 1;
      
      // Then prioritize by shorter URLs (simpler variants)
      return urlA.length - urlB.length;
    });
  }

  /**
   * Get selectors for specific site
   */
  private getSelectorsForSite(site: 'amazon' | 'noon' | 'ikea'): string[] {
    switch (site) {
      case 'amazon':
        return [
          'a[href*="/dp/"]',
          'a[href*="/gp/product/"]',
          'h2 a',
          '[data-component-type="s-search-result"] h2 a',
          '.s-result-item h2 a'
        ];
      case 'noon':
        return [
          'a[href*="/p/"]',
          'a[href*="/uae-en/"]',
          '[data-testid*="product"] a',
          '.productContainer a',
          '[data-qa*="product"] a',
          '.product a',
          '[class*="product"] a',
          '[class*="Product"] a'
        ];
      case 'ikea':
        return [
          // Product card header link (image area)
          'a.card-header_link',
          // Product name link (title area)
          'a.itemName-link',
          // Fallback: any anchor with /pd/ in href (product detail pages)
          'a[href*="/pd/"]',
        ];
    }
  }

  /**
   * Check if URL is a valid product URL
   */
  private isValidProductUrl(url: string, site: 'amazon' | 'noon' | 'ikea'): boolean {
    switch (site) {
      case 'amazon':
        return url.includes('/dp/') || url.includes('/gp/product/');
      case 'noon':
        return url.includes('/uae-en/') && (url.includes('/p/') || url.includes('-N'));
      case 'ikea':
        // IKEA product URLs contain /pd/ (product detail) with format: /pd/{product-name}-art-{article-number}
        return url.includes('/pd/');
    }
  }

  /**
   * Normalize URL to absolute format
   */
  private normalizeUrl(url: string, site: 'amazon' | 'noon' | 'ikea'): string {
    if (url.startsWith('http')) {
      return url.split('?')[0]; // Remove query params
    }
    switch (site) {
      case 'amazon':
        return `https://www.amazon.com${url.split('?')[0]}`;
      case 'noon':
        return `https://www.noon.com${url.split('?')[0]}`;
      case 'ikea':
        // Use the current domain for IKEA (to support .pr, .eg, etc.)
        return `${window.location.origin}${url.split('?')[0]}`;
    }
  }

  /**
   * Stop scraping
   */
  public stopScraping(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    console.log('Scraping stopped');
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const productScraper = new ProductScraper();
