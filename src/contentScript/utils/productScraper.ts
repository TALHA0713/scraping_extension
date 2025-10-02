/**
 * Product Scraper Utility
 * Extracts product URLs from supported e-commerce sites
 */

export interface ProductLink {
  url: string;
  title: string;
  source: 'amazon' | 'noon' | 'ikea';
}

export interface ScrapingResult {
  totalLinks: number;
  links: ProductLink[];
  source: string;
  timestamp: number;
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
    this.setupUrlMonitoring();
    this.setupMutationObserver();
    this.extractInitialProducts();
  }

  /**
   * Setup URL monitoring for SPA navigation
   */
  private setupUrlMonitoring(): void {
    let currentUrl = window.location.href;
    
    // Monitor URL changes
    const checkUrlChange = () => {
      if (window.location.href !== currentUrl) {
        const newUrl = window.location.href;
        const oldUrl = currentUrl;
        currentUrl = newUrl;
        
        console.log('URL changed from:', oldUrl, 'to:', newUrl);
        
        // Handle different sites differently
        const isAmazonSearch = newUrl.includes('amazon.com') && newUrl.includes('/s');
        const isNoonPage = newUrl.includes('noon.com');
        const isIkeaSearch = newUrl.includes('ikea.com') && newUrl.includes('/search');
        
        if (isAmazonSearch || isIkeaSearch) {
          // For Amazon and IKEA, only clear on search pages
          console.log('Still on search page, clearing and re-extracting products');
          this.productUrls.clear();
          setTimeout(() => this.extractInitialProducts(), 1000);
        } else if (isNoonPage) {
          // For Noon, always extract products (search or product pages)
          console.log('On Noon page, extracting products');
          setTimeout(() => this.extractInitialProducts(), 1000);
        } else {
          console.log('Navigated away from supported page, keeping existing products');
        }
      }
    };

    // Check for URL changes every 500ms
    setInterval(checkUrlChange, 500);
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
      
      // Check for ANY Noon page (not just search pages)
      if (hostname.includes('noon.com')) {
        return true;
      }
      
      // Check for IKEA search page
      if (hostname.includes('ikea.com') && pathname.includes('/search')) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Error parsing URL:', error);
      return false;
    }
  }

  /**
   * Setup MutationObserver to watch for DOM changes (infinite scroll)
   */
  private setupMutationObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      let shouldExtract = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes contain product links
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

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Check if an element contains product links
   */
  private containsProductLinks(element: Element): boolean {
    const selectors = this.getSelectorsForCurrentSite();
    return selectors.some(selector => element.querySelector(selector) !== null);
  }

  /**
   * Extract products on initial page load
   */
  private extractInitialProducts(): void {
    setTimeout(() => {
      this.extractProducts();
    }, 2000); // Wait for page to fully load
  }

  /**
   * Extract product URLs from the current page
   */
  private extractProducts(): void {
    const site = this.getCurrentSite();
    if (!site) return;
    
    // For Noon, extract products on any page
    // For Amazon and IKEA, only extract on search pages
    if (site === 'amazon' || site === 'ikea') {
      if (!this.isSearchPage()) {
        console.log('Not on search page, skipping product extraction');
        return;
      }
    }

    const selectors = this.getSelectorsForSite(site);
    const newLinks: ProductLink[] = [];

    selectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && this.isValidProductUrl(href, site)) {
          const fullUrl = this.normalizeUrl(href, site);
          const title = link.textContent?.trim() || '';

          if (!this.productUrls.has(fullUrl)) {
            this.productUrls.add(fullUrl);
            newLinks.push({
              url: fullUrl,
              title: title,
              source: site
            });
          }
        }
      });
    });

    if (newLinks.length > 0) {
      console.log(`Found ${newLinks.length} new product links from ${site}:`, newLinks);
      this.notifyBackgroundScript(newLinks);
    }
  }

  /**
   * Get all extracted product URLs
   */
  public getAllProducts(): ProductLink[] {
    return Array.from(this.productUrls).map(url => ({
      url,
      title: '',
      source: this.getCurrentSite() || 'amazon'
    }));
  }

  /**
   * Get current site type
   */
  private getCurrentSite(): 'amazon' | 'noon' | 'ikea' | null {
    const hostname = window.location.hostname;
    if (hostname.includes('amazon.com')) return 'amazon';
    if (hostname.includes('noon.com')) return 'noon';
    if (hostname.includes('ikea.com')) return 'ikea';
    return null;
  }

  /**
   * Get selectors for current site
   */
  private getSelectorsForCurrentSite(): string[] {
    const site = this.getCurrentSite();
    return site ? this.getSelectorsForSite(site) : [];
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
          '.s-result-item h2 a',
          'a[href*="amazon.com/dp/"]'
        ];
      case 'noon':
        return [
          'a[href*="/p/"]',
          'a[href*="/uae-en/p/"]',
          '[data-testid*="product"] a',
          '.productContainer a',
          '[data-qa*="product"] a',
          'a[href*="noon.com/p/"]',
          '.product a',
          '[class*="product"] a'
        ];
      case 'ikea':
        return [
          'a[href*="/products/"]',
          'a[href*="/p/"]',
          '.product a',
          '[data-testid*="product"] a'
        ];
      default:
        return [];
    }
  }

  /**
   * Check if URL is a valid product URL for the site
   */
  private isValidProductUrl(url: string, site: 'amazon' | 'noon' | 'ikea'): boolean {
    switch (site) {
      case 'amazon':
        return url.includes('/dp/') || url.includes('/gp/product/');
      case 'noon':
        return url.includes('/p/') || url.includes('noon.com/p/');
      case 'ikea':
        return url.includes('/products/') || url.includes('/p/');
      default:
        return false;
    }
  }

  /**
   * Normalize URL to absolute format
   */
  private normalizeUrl(url: string, site: 'amazon' | 'noon' | 'ikea'): string {
    if (url.startsWith('http')) {
      return url;
    }

    switch (site) {
      case 'amazon':
        return `https://www.amazon.com${url}`;
      case 'noon':
        return `https://www.noon.com${url}`;
      case 'ikea':
        return `https://www.ikea.com${url}`;
      default:
        return url;
    }
  }

  /**
   * Notify background script about new products
   */
  private async notifyBackgroundScript(products: ProductLink[]): Promise<void> {
    const result: ScrapingResult = {
      totalLinks: this.productUrls.size,
      links: products,
      source: this.getCurrentSite() || 'unknown',
      timestamp: Date.now()
    };

    // Send to background script with error handling
    try {
      await chrome.runtime.sendMessage({
        type: 'PRODUCTS_EXTRACTED',
        data: result
      });
    } catch (error) {
      // Silently handle extension context invalidation
      if (error instanceof Error && !error.message.includes('Extension context invalidated')) {
        console.log('Failed to send message to background script:', error);
      }
    }

    // Also log to console for debugging
    console.log('Product scraping result:', result);
  }

  /**
   * Stop scraping (pause URL monitoring and mutation observer)
   */
  public stopScraping(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    console.log('Scraping stopped - URL monitoring and mutation observer disabled');
  }

  /**
   * Resume scraping (restart URL monitoring and mutation observer)
   */
  public resumeScraping(): void {
    if (this.isInitialized && !this.observer) {
      this.setupMutationObserver();
      console.log('Scraping resumed - URL monitoring and mutation observer restarted');
    }
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
