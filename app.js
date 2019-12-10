const path = require('path');
const _ = require('lodash');
const csv = require('csv-parser');
const fs = require('fs');

const RedditScraper = require('reddit-scraper');

const configDir = path.join(__dirname, './config');
const config = JSON.parse(fs.readFileSync(path.join(configDir, 'config.json')));

const Discord = require('discord.js');
const client = new Discord.Client();

console.log('Reddit Shopper');

const LOGIN_TOKEN = 'NjUzNzMzNjk4Mjg1NDY5NzU2.Xe7TDA.88_9ek9f7LplBpn0FsUIX0yJPxo';
client.login(LOGIN_TOKEN);

client.once('ready', () => {
    console.log('reddit-shopper bot is ready!');
});

// On any message submitted, log it. This is chatty 
client.on('message', message => {

    if (message.content === '!server') {
        message.channel.send('Server:\t' + message.guild.name + '\n' + message.guild.memberCount + ' total members');
    }
    else if (message.content.startsWith('!shop')) {

        let splitMessage = _.split(message.content, ' ');
        let sub = splitMessage[1];

        if (sub == null || sub == undefined || sub == '') {
            message.channel.send('shop requires an argument, like this `!shop buildapcsales`');
            return;
        }

        const deals = [];
        fs.createReadStream(path.join(configDir, 'deals.csv'))
            .pipe(csv())
            .on('data', (data) => deals.push(data))
            .on('end', () => {

                console.log('\nSearching for these deals\n\t' + JSON.stringify(deals) + '\non /r/' + sub + '\n');

                const redditScraperOptions = {
                    AppId: config.reddit_app_id,
                    AppSecret: config.reddit_app_secret,
                };

                const requestOptions = {
                    Pages: 5,
                    Records: 25,
                    SubReddit: sub,
                    SortType: "new",
                };

                try {
                    let datas = [];
                    const redditScraper = new RedditScraper.RedditScraper(redditScraperOptions);
                    redditScraper
                        .scrapeData(requestOptions)
                        .then(function (scrapedData) {
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

                            let response = '/r/' + sub + '\n';

                            if (datas.length > 0) {

                                _.forEach(datas, (data) => {
                                    response += '\t> ' + data.title + '\n';
                                });
                            }
                            else {
                                response += '\t > No deals found\n';
                            }

                            message.channel.send(response);
                        });

                } catch (error) {
                    console.log(error);
                }
            });
    }
    else {
        console.log(message.content);
    }
});