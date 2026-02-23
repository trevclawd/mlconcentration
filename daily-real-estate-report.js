#!/usr/bin/env node
/**
 * Daily Real Estate Report Generator
 * Sends a morning report of newest properties to Telegram
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const OBSIDIAN_VAULT = '/work/obsidian-vault';
const REAL_ESTATE_FOLDER = 'Real Estate Mission Control';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8246774116:AAHVIqd8Pmag41gLuFPQcVNpSEmoBI6ttfA';
const TELEGRAM_CHAT_ID = '7520015564';

// Find all profile folders
function findProfileFolders() {
    const reFolderPath = path.join(OBSIDIAN_VAULT, REAL_ESTATE_FOLDER);
    if (!fs.existsSync(reFolderPath)) {
        console.error('Real Estate Mission Control folder not found');
        return [];
    }
    
    return fs.readdirSync(reFolderPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('<'))
        .map(dirent => dirent.name);
}

// Parse the latest.md file for a profile
function parseLatestReport(profileName) {
    const latestPath = path.join(OBSIDIAN_VAULT, REAL_ESTATE_FOLDER, profileName, 'latest.md');
    
    if (!fs.existsSync(latestPath)) {
        console.error(`No latest.md found for ${profileName}`);
        return null;
    }
    
    const content = fs.readFileSync(latestPath, 'utf8');
    return content;
}

// Extract property details from markdown
function extractProperties(content) {
    const properties = [];
    
    // Match property sections like:
    // ### #15: 1023 Liberty Ave, Livingston, TX 77351
    const sections = content.split(/### #(\d+): (.+?)\n/);
    
    // sections[0] is the header, then it alternates: rank, address, content, rank, address, content...
    for (let i = 1; i < sections.length - 1; i += 3) {
        const rank = parseInt(sections[i]);
        const address = sections[i + 1].trim();
        const sectionContent = sections[i + 2];
        
        // Extract details from the section
        const priceMatch = sectionContent.match(/\*\*\$([\d,]+)\*\* \| (\d+) bed \/ ([\d.]+) bath \| ([\d,]+) sqft \| Built (\d{4})/);
        const valueMatch = sectionContent.match(/\*\*Estimated Value:\*\* \$([\d,]+)/);
        const gapMatch = sectionContent.match(/\*\*Value Gap:\*\* ([\d.-]+)%/);
        const distanceMatch = sectionContent.match(/\*\*Distance to home base:\*\* ([\d.]+) mi/);
        const listingMatch = sectionContent.match(/Listing: \[View Listing\]\((.+?)\)/);
        const photoMatches = sectionContent.match(/!\[Property photo \d+\]\((.+?)\)/g);
        
        if (priceMatch) {
            properties.push({
                rank,
                address,
                price: parseInt(priceMatch[1].replace(/,/g, '')),
                beds: parseInt(priceMatch[2]),
                baths: parseFloat(priceMatch[3]),
                sqft: parseInt(priceMatch[4].replace(/,/g, '')),
                yearBuilt: parseInt(priceMatch[5]),
                estimatedValue: valueMatch ? parseInt(valueMatch[1].replace(/,/g, '')) : null,
                valueGap: gapMatch ? parseFloat(gapMatch[1]) : null,
                distance: distanceMatch ? parseFloat(distanceMatch[1]) : null,
                listingUrl: listingMatch ? listingMatch[1] : null,
                photos: photoMatches ? photoMatches.map(p => p.match(/\((.+?)\)/)[1]) : []
            });
        }
    }
    
    return properties;
}

// Get top properties by build year
function getNewestProperties(properties, count = 10) {
    return properties
        .filter(p => p.yearBuilt)
        .sort((a, b) => b.yearBuilt - a.yearBuilt)
        .slice(0, count);
}

// Format price
function formatPrice(price) {
    return '$' + parseInt(price).toLocaleString();
}

// Send Telegram message
function sendTelegramMessage(message) {
    return new Promise((resolve, reject) => {
        console.log(`sendTelegramMessage called with message length: ${message ? message.length : 'null/undefined'}`);
        
        if (!message || message.trim().length === 0) {
            reject(new Error('Message is empty'));
            return;
        }
        
        const data = JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });
        
        console.log(`Sending ${data.length} bytes to Telegram`);
        
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`Telegram API error: ${res.statusCode} ${body}`));
                }
            });
        });
        
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Generate report
function generateReport(profileName, properties) {
    const newest = getNewestProperties(properties, 10);
    const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let report = `🏠 <b>DAILY REAL ESTATE REPORT</b>\n`;
    report += `📍 Profile: ${profileName}\n`;
    report += `📅 ${today}\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    report += `<b>🏗️ TOP 10 NEWEST PROPERTIES</b>\n\n`;
    
    newest.forEach((prop, idx) => {
        const valueGapStr = prop.valueGap ? `${prop.valueGap > 0 ? '+' : ''}${prop.valueGap}%` : 'N/A';
        const emoji = prop.yearBuilt >= 2020 ? '🆕' : prop.yearBuilt >= 2010 ? '✨' : '🏠';
        
        report += `<b>${idx + 1}. ${emoji} Built ${prop.yearBuilt}</b>\n`;
        report += `📍 ${prop.address}\n`;
        report += `💰 ${formatPrice(prop.price)} | ${prop.beds}bd/${prop.baths}ba | ${prop.sqft.toLocaleString()} sqft\n`;
        
        if (prop.estimatedValue) {
            report += `📊 Est: ${formatPrice(prop.estimatedValue)} | Gap: ${valueGapStr}\n`;
        }
        
        if (prop.distance) {
            report += `📏 ${prop.distance} mi from base\n`;
        }
        
        if (prop.listingUrl) {
            report += `🔗 ${prop.listingUrl.substring(0, 50)}${prop.listingUrl.length > 50 ? '...' : ''}\n`;
        }
        
        if (prop.photos && prop.photos.length > 0) {
            report += `📸 ${prop.photos.length} photos available\n`;
        }
        
        report += `\n`;
    });
    
    // Summary stats
    const avgPrice = Math.round(newest.reduce((sum, p) => sum + p.price, 0) / newest.length);
    const avgYear = Math.round(newest.reduce((sum, p) => sum + p.yearBuilt, 0) / newest.length);
    const bestValue = newest.reduce((best, p) => 
        (p.valueGap && (!best || p.valueGap > best.valueGap)) ? p : best, null);
    
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `<b>📊 QUICK STATS:</b>\n`;
    report += `• Avg Price: ${formatPrice(avgPrice)}\n`;
    report += `• Avg Year Built: ${avgYear}\n`;
    report += `• Total Properties Tracked: ${properties.length}\n`;
    
    if (bestValue) {
        report += `• 🔥 Best Value: ${bestValue.address.split(',')[0]}\n`;
        report += `  (${bestValue.valueGap > 0 ? '+' : ''}${bestValue.valueGap}% gap)\n`;
    }
    
    return report;
}

// Main function
async function main() {
    console.log('Starting daily real estate report...');
    console.log('Time:', new Date().toISOString());
    
    try {
        // Find profile folders
        const profiles = findProfileFolders();
        console.log('Found profiles:', profiles);
        
        if (profiles.length === 0) {
            console.log('No profiles found');
            return;
        }
        
        // Process each profile
        for (const profile of profiles) {
            console.log(`Processing profile: ${profile}`);
            
            const content = parseLatestReport(profile);
            if (!content) continue;
            
            const properties = extractProperties(content);
            console.log(`Found ${properties.length} properties in ${profile}`);
            
            if (properties.length === 0) continue;
            
            // Generate and send report
            const report = generateReport(profile, properties);
            console.log(`Generated report, length: ${report.length}`);
            console.log(`Report preview: ${report.substring(0, 200)}...`);
            
            // Split into chunks if too long (Telegram limit is 4096 chars)
            const chunks = [];
            let currentChunk = '';
            
            const lines = report.split('\n');
            console.log(`Split into ${lines.length} lines`);
            for (const line of lines) {
                if (currentChunk.length + line.length + 1 > 4000) {
                    chunks.push(currentChunk);
                    currentChunk = line + '\n';
                } else {
                    currentChunk += line + '\n';
                }
            }
            if (currentChunk) chunks.push(currentChunk);
            
            // Send each chunk
            for (let i = 0; i < chunks.length; i++) {
                console.log(`Sending chunk ${i + 1}/${chunks.length}...`);
                console.log(`Chunk ${i + 1} length: ${chunks[i].length}`);
                console.log(`Chunk ${i + 1} preview: ${chunks[i].substring(0, 100)}...`);
                await sendTelegramMessage(chunks[i]);
                // Small delay between messages
                await new Promise(r => setTimeout(r, 500));
            }
            
            console.log(`Report sent for ${profile}`);
        }
        
        console.log('Daily report complete!');
        
    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, generateReport, extractProperties };
