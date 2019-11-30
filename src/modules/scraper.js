
const RedditScraper = require('reddit-scraper');
const _ = require('lodash');
/**
 * Scrapes the given subreddit for new posts
 * 
 * @param {String} appId the ID for your reddit app
 * @param {String} appSecret the secret for your reddit app
 * @param {String} subreddit the name of the subreddit to scrape
 * @param {Object} deals loaded from deals.csv
 */
const scrapeSubreddit = (appId, appSecret, subreddit, deals) => {
    (async () => {

        const redditScraperOptions = {
            AppId: appId,
            AppSecret: appSecret,
        };

        const requestOptions = {
            Pages: 1,
            Records: 3,
            SubReddit: subreddit,
            SortType: "new",
        };

        try {
            const redditScraper = new RedditScraper.RedditScraper(redditScraperOptions);
            const scrapedData = await redditScraper.scrapeData(requestOptions);

            let datas = [];

            _.forEach(scrapedData, (scrape) => {
                let data = scrape.data;
                let title = data.title;

                _.forEach(deals, (deal) => {
                    if (title.includes(deal.keyword)) {

                        let splitTitle = title.split(' ');
                        _.forEach(splitTitle, (split) => {
                            let regex = new RegExp('^' + deal.keyword + '$');
                            let match = split.replace(',', '').match(regex);
                            if (match) {
                                datas.push(data);
                            }
                        });
                    }
                });
            });

            console.log(subreddit + ':')
            if (datas.length > 0) {

                _.forEach(datas, (data) => {
                    console.log('\t> ' + data.title);
                });
            }
            else {
                console.log('\t > No deals found')
            }
        } catch (error) {
            console.error(error);
        }
    })();
}

module.exports = {
    scrapeSubreddit
}