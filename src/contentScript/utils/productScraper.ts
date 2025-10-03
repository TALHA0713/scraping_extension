/**
 * Product Scraper Utility
 * Extracts product URLs from supported e-commerce sites
 */

export interface ProductLink {
  url: string;
  title: string;
  source: 'amazon' | 'noon';
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

      return false;
    } catch (error) {
      console.log('Error parsing URL:', error);
      return false;
    }
  }

  /**
   * Get current site
   */
  private getCurrentSite(): 'amazon' | 'noon' | null {
    const hostname = window.location.hostname;
    if (hostname.includes('amazon.com')) return 'amazon';
    if (hostname.includes('noon.com')) return 'noon';
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
        const href = link.getAttribute('href');
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
    return Array.from(this.productUrls).map(url => ({
      url,
      title: '',
      source: site || 'amazon'
    }));
  }

  /**
   * Get selectors for specific site
   */
  private getSelectorsForSite(site: 'amazon' | 'noon'): string[] {
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
    }
  }

  /**
   * Check if URL is a valid product URL
   */
  private isValidProductUrl(url: string, site: 'amazon' | 'noon'): boolean {
    switch (site) {
      case 'amazon':
        return url.includes('/dp/') || url.includes('/gp/product/');
      case 'noon':
        return url.includes('/uae-en/') && (url.includes('/p/') || url.includes('-N'));
    }
  }

  /**
   * Normalize URL to absolute format
   */
  private normalizeUrl(url: string, site: 'amazon' | 'noon'): string {
    if (url.startsWith('http')) {
      return url.split('?')[0]; // Remove query params
    }

    switch (site) {
      case 'amazon':
        return `https://www.amazon.com${url.split('?')[0]}`;
      case 'noon':
        return `https://www.noon.com${url.split('?')[0]}`;
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
