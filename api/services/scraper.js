import axios from 'axios';
import * as cheerio from 'cheerio';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { promises as fs } from 'fs';
import path from 'path';

class GitLabScraper {
  constructor() {
    this.visited = new Set();
    this.queue = [];
    this.data = [];
    this.maxPages = 500; // Limit to prevent infinite scraping
    this.requestCount = 0;
    this.saveInterval = 50; // Save every 50 pages
    this.outputPath = null; // Will be set when scraping starts
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchPage(url) {
    try {
      await this.delay(config.scraping.delayMs);
      
      logger.info(`Fetching: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': config.scraping.userAgent
        },
        timeout: config.scraping.timeout
      });

      this.requestCount++;
      return response.data;
    } catch (error) {
      logger.error(`Error fetching ${url}: ${error.message}`);
      return null;
    }
  }

  extractLinks($, baseUrl) {
    const links = new Set();
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      
      let fullUrl;
      try {
        fullUrl = new URL(href, baseUrl).href;
      } catch (e) {
        return;
      }
      
      // Only include links from handbook or direction
      if (fullUrl.startsWith(config.gitlab.handbookUrl) || 
          fullUrl.startsWith(config.gitlab.directionUrl)) {
        // Remove anchors and query params for deduplication
        const cleanUrl = fullUrl.split('#')[0].split('?')[0];
        links.add(cleanUrl);
      }
    });
    
    return Array.from(links);
  }

  extractContent($, url) {
    // Remove script, style, nav, footer elements
    $('script, style, nav, footer, .navbar, .sidebar, .advertisement').remove();
    
    // Extract main content - adjust selectors based on GitLab's structure
    const mainContent = $('main, article, .content, .markdown-section, #content').first();
    
    const title = $('h1').first().text().trim() || 
                  $('title').text().trim() || 
                  'Untitled';
    
    const textContent = mainContent.length > 0 
      ? mainContent.text() 
      : $('body').text();
    
    // Clean up whitespace
    const cleanText = textContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    
    if (cleanText.length < 100) {
      return null; // Skip pages with minimal content
    }
    
    // Extract headings for better context
    const headings = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text) headings.push(text);
    });
    
    return {
      url,
      title,
      content: cleanText,
      headings,
      wordCount: cleanText.split(/\s+/).length,
      scrapedAt: new Date().toISOString()
    };
  }

  async scrapePage(url) {
    if (this.visited.has(url) || this.visited.size >= this.maxPages) {
      return;
    }
    
    this.visited.add(url);
    
    const html = await this.fetchPage(url);
    if (!html) return;
    
    const $ = cheerio.load(html);
    
    // Extract content
    const pageData = this.extractContent($, url);
    if (pageData) {
      this.data.push(pageData);
      logger.info(`Scraped: ${url} (${pageData.wordCount} words)`);
    }
    
    // Extract and queue new links
    const links = this.extractLinks($, url);
    for (const link of links) {
      if (!this.visited.has(link) && !this.queue.includes(link)) {
        this.queue.push(link);
      }
    }
  }

  async scrapeHandbook() {
    logger.info('Starting GitLab Handbook scraping...');
    
    // Set output path for periodic saves
    this.outputPath = path.join(process.cwd(), '../data/scraped_data.json');
    
    // Start URLs
    const startUrls = [
      config.gitlab.handbookUrl,
      config.gitlab.directionUrl
    ];
    
    this.queue.push(...startUrls);
    
    while (this.queue.length > 0 && this.visited.size < this.maxPages) {
      const url = this.queue.shift();
      await this.scrapePage(url);
      
      // Save periodically every 50 pages
      if (this.data.length > 0 && this.data.length % this.saveInterval === 0) {
        await this.saveDataInternal();
        logger.info(`💾 Auto-saved ${this.data.length} pages to disk`);
      }
      
      // Log progress
      if (this.visited.size % 10 === 0) {
        logger.info(`Progress: ${this.visited.size} pages scraped, ${this.queue.length} in queue`);
      }
    }
    
    // Final save
    await this.saveDataInternal();
    logger.info(`Scraping complete! Total pages: ${this.data.length}`);
    return this.data;
  }

  async saveDataInternal() {
    if (!this.outputPath || this.data.length === 0) return;
    
    const dataDir = path.dirname(this.outputPath);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(
      this.outputPath,
      JSON.stringify(this.data, null, 2),
      'utf-8'
    );
  }

  async saveData(outputPath) {
    const dataDir = path.dirname(outputPath);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(
      outputPath,
      JSON.stringify(this.data, null, 2),
      'utf-8'
    );
    
    logger.info(`Data saved to ${outputPath}`);
    
    // Save metadata
    const metadata = {
      totalPages: this.data.length,
      totalWords: this.data.reduce((sum, page) => sum + page.wordCount, 0),
      scrapedAt: new Date().toISOString(),
      requestCount: this.requestCount
    };
    
    await fs.writeFile(
      path.join(dataDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
    
    return metadata;
  }
}

export default GitLabScraper;
