import GitLabScraper from '../services/scraper.js';
import logger from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    logger.info('=== GitLab Data Scraping Started ===');
    
    const scraper = new GitLabScraper();
    
    // Scrape data
    await scraper.scrapeHandbook();
    
    // Save data
    const outputPath = path.join(__dirname, '../../../data/scraped_data.json');
    const metadata = await scraper.saveData(outputPath);
    
    logger.info('=== Scraping Complete ===');
    logger.info(`Total pages: ${metadata.totalPages}`);
    logger.info(`Total words: ${metadata.totalWords}`);
    logger.info(`Data saved to: ${outputPath}`);
    
  } catch (error) {
    logger.error(`Scraping failed: ${error.message}`);
    process.exit(1);
  }
}

main();
