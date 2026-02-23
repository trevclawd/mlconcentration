/**
 * Scheduler for daily real estate report
 * Runs the report generation at 7:00 AM Central time every day
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPORT_SCRIPT = path.join('/work', 'daily-real-estate-report.js');

// Central time is UTC-6 (CST) or UTC-5 (CDT during DST)
// 7:00 AM Central = 13:00 UTC (CST) or 12:00 UTC (CDT)
// We'll use 13:00 UTC as a baseline
const REPORT_HOUR = 13; // 7 AM Central (CST)
const REPORT_MINUTE = 0;

function getNextRunTime() {
    const now = new Date();
    const next = new Date(now);
    
    next.setHours(REPORT_HOUR, REPORT_MINUTE, 0, 0);
    
    // If already passed today's run time, schedule for tomorrow
    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }
    
    return next;
}

function scheduleNextRun() {
    const nextRun = getNextRunTime();
    const now = new Date();
    const delay = nextRun - now;
    
    console.log(`Next report scheduled for: ${nextRun.toISOString()}`);
    console.log(`Delay: ${Math.round(delay / 1000)} seconds (${Math.round(delay / 1000 / 60)} minutes)`);
    
    setTimeout(() => {
        runReport();
        // Schedule again for tomorrow
        setTimeout(() => scheduleNextRun(), 24 * 60 * 60 * 1000);
    }, delay);
}

function runReport() {
    console.log(`Running real estate report at ${new Date().toISOString()}...`);
    
    const child = exec(`node ${REPORT_SCRIPT}`, {
        cwd: '/work',
        env: process.env,
        shell: true
    });
    
    child.stdout.on('data', (data) => {
        console.log(`[REPORT] ${data.trim()}`);
    });
    
    child.stderr.on('data', (data) => {
        console.error(`[REPORT ERROR] ${data.trim()}`);
    });
    
    child.on('close', (code) => {
        if (code === 0) {
            console.log(`Report completed successfully`);
        } else {
            console.error(`Report failed with code ${code}`);
        }
    });
}

// Main function
function main() {
    console.log('Starting daily real estate report scheduler...');
    console.log(`Report script: ${REPORT_SCRIPT}`);
    console.log(`Scheduled time: ${REPORT_HOUR}:${REPORT_MINUTE} UTC (7 AM Central)`);
    
    // Run immediately on startup for testing, then schedule
    runReport();
    
    // Schedule next run for tomorrow
    setTimeout(() => scheduleNextRun(), 24 * 60 * 60 * 1000);
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { main, scheduleNextRun };