const path = require('path');
const _ = require('lodash');

const scraper = require('./modules/scraper');

const csv = require('csv-parser');
const fs = require('fs');

const configDir = path.join(__dirname, '../config');

const config = JSON.parse(fs.readFileSync(path.join(configDir, 'config.json')));

console.log('Reddit Shopper');

const subreddits = [];
fs.createReadStream(path.join(configDir, 'subreddits.csv'))
    .pipe(csv())
    .on('data', (data) => subreddits.push(data))
    .on('end', () => {

        const deals = [];
        fs.createReadStream(path.join(configDir, 'deals.csv'))
            .pipe(csv())
            .on('data', (data) => deals.push(data))
            .on('end', () => {

                console.log('\nSearching for these deals\n\t%j\non these subreddits\n\t%j\n', deals, subreddits);

                _.forEach(subreddits, (subreddit) => {
                    scraper.scrapeSubreddit(config.reddit_app_id, config.reddit_app_secret, subreddit.name, deals);
                });
            });
    });
