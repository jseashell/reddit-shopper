const path = require('path');
const _ = require('lodash');
const csv = require('csv-parser');
const fs = require('fs');
const RedditScraper = require('reddit-scraper');
const Discord = require('discord.js');

const configDir = path.join(__dirname, './config');
console.log('Configuration location:\n\t> ' + configDir);

const config = JSON.parse(fs.readFileSync(path.join(configDir, 'config.json')));

const redditScraper =
    new RedditScraper.RedditScraper({
        AppId: config.reddit_app_id,
        AppSecret: config.reddit_app_secret,
    });

/**
 * Main entry point
 */
console.log('Starting reddit-shopper...');

const discordClient = new Discord.Client();
discordClient.login(config.discord_login_token);
console.log('Successfully logged into Discord');
discordClient.once('ready', () => {
    console.log('reddit-shopper running!');
});

// On any message submitted, log it. This is chatty 
discordClient.on('message', message => {

    // Regex to match '!shop -command commandArg', where commandArg is optional, and commands that are wrapped in discord markdown are ignored
    let regex = /^(?:(?![`])!shop (-\S+)(\s.*)?)$/;
    let match = regex.exec(message.content);

    if (match && match.length > 0) {
        let messageData = {
            command: match[1],
            commandArg: (match[2] || '').trim(),
        }

        console.log('Received command "' + messageData.command + '" with arg "' + messageData.commandArg + '"');

        if (messageData.command == '-r') {
            let sub = messageData.commandArg;

            // Validate that there was a subreddit argument
            if (sub == null || sub == undefined || sub == '') {
                let errorMsg = '`' + messageData.command + '` requires a subreddit, like this: `!shop ' + messageData.command + ' buildapcsales`';
                console.error(errorMsg)
                message.channel.send(errorMsg);
                return;
            }

            // TODO Consier validating subreddit using scrapper error handling
            // Validate that the sub is word characters only (equivalent to [a-zA-Z0-9_]*)
            if (/\W/.exec(sub)) {
                console.error('Received ' + messageData.command + ' with invalid arg "' + messageData.commandArg + '"');
                message.channel.send('/r/subsifellfor'); // Silly response
                return;
            }

            scrapeSub(message.channel, sub);
        }
    }
});

/**
 * Handles '!shop <subreddit>' from discord user
 * 
 * @param {Object} channel the channel for sending the response to the discord client
 * @param {String} sub the subreddit to scrape
 */
const scrapeSub = (channel, sub) => {
    const deals = [];
    fs.createReadStream(path.join(configDir, 'deals.csv'))
        .pipe(csv())
        .on('data', (data) => deals.push(data))
        .on('end', () => {
            try {
                redditScraper
                    .scrapeData({
                        /* options */
                        Pages: 5,
                        Records: 25,
                        SubReddit: sub,
                        SortType: 'new',
                    })
                    .then(function (scrapedData) {
                        let response = buildResponse(sub, scrapedData, deals);
                        channel.send({
                            embed: response
                        });
                    });
            } catch (error) {
                console.log(error);
            }
        });
}

/**
 * TODO rename this method and give it a good description
 * 
 * @param {String} sub the subreddit
 * @param {Array} scrapedData the scraped reddit data
 * @param {Array} deals the deals to shop for. should be loaded from persistence layer
 */
const buildResponse = (sub, scrapedData, deals) => {
    let embed = new Discord.RichEmbed()
        .setTitle('/r/' + sub)

    _.forEach(scrapedData, (scrape) => {
        _.forEach(deals, (deal) => {
            if (scrape.data.title.includes(deal.keyword)) {
                let splitTitle = scrape.data.title.split(' ');

                _.forEach(splitTitle, (split) => {
                    let regex = new RegExp('^' + deal.keyword + '$');

                    let match = split.replace(',', '').match(regex);
                    if (match) {
                        embed.addField(deal.keyword, '[' + scrape.data.title + '](' + scrape.data.url + ')');
                    }
                });
            }
        });
    });

    return embed;
}