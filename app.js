console.log('Starting reddit-shopper...');
const path = require('path');
const _ = require('lodash');
const csv = require('csv-parser');
const fs = require('fs');
const RedditScraper = require('reddit-scraper');
const Discord = require('discord.js');

console.log('Loading config.json')
const configDir = path.join(__dirname, './config');
console.log('> Location: ' + configDir);
const config = JSON.parse(fs.readFileSync(path.join(configDir, 'config.json')));
console.log('> Success!');

const redditScraper =
    new RedditScraper.RedditScraper({
        AppId: config.reddit_app_id,
        AppSecret: config.reddit_app_secret,
    });

/**
 * Main entry point
 */

const discordClient = new Discord.Client();
console.log('Configuring discord client');
discordClient.once('ready', () => {
    console.log('Discord client is ready');
});

// Configure the discord client to handle command messages in the entre server.
discordClient.on('message', message => {

    // Assert that the message came from a channel that the bot is configured to chat in.
    if (!_.includes(config.channels, message.channel.name)) {
        // Don't do any logging here. This is going to get hit for MOST messages in a server, so just return
        return;
    }

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

            if (isSubreddit(sub)) {
                message.channel.send('/r/subsifellfor'); // Silly response
            }

            scrapeSubAndSendResponse(sub, message.channel);
        }
    }
});

console.log('Logging into discord')
discordClient.login(config.discord_login_token);
console.log('> Success!');
console.log('\nreddit-shopper is running\n');

/**
 * Validates that the given sub is word characters only (equivalent to [a-zA-Z0-9_]*)}
 *  
 * TODO Consier validating subreddit using scrapper error handling
 * 
 * @param {String} subreddit to validate
 * @return {Boolean} true if the subreddit is word only
 */
const isSubreddit = (subreddit) => {
    if (/\W/.exec(subreddit)) {
        return true;
    }

    return false;
}
/**
 * Scrapes the given sub, then responds to a specific channel with an embed message containing scrape results
 * 
 * @param {String} sub the subreddit to scrape
 * @param {Object} messageChannel the channel for sending the response to the discord client
 */
const scrapeSubAndSendResponse = (sub, messageChannel) => {
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
                let response = buildResponseFromScrapedData(sub, scrapedData);
                messageChannel.send({
                    embed: response
                });
            });
    } catch (error) {
        console.log(error);
    }
}

/**
 * Builds a nice embed response using the given scraped data
 * 
 * @param {String} sub the subreddit
 * @param {Array} scrapedData the scraped reddit data
 */
const buildResponseFromScrapedData = (sub, scrapedData) => {
    let embed = new Discord.RichEmbed()
        .setTitle('/r/' + sub)

    _.forEach(scrapedData, (scrape) => {
        let title = scrape.data.title;

        if (/.*\[H].*paypal.*\[W]/ig.exec(title)) {
            //console.error('Filtered title "' + title + '"');
            return;
        }

        console.log('Searching title "' + title + '"');


        // Build a regex containing optional groups for all the deal subscription keywords
        // Example: "(1080)?(1080\sti)?(2080\sti)"
        let deals = JSON.parse(fs.readFileSync('./deals.json'));
        let dealGroups = '';
        _.forEach(deals.subscriptions, (dealSubscription) => {
            let keyword = dealSubscription.keyword;

            dealGroups += '(' + keyword.replace(' ', '\\s{1}') + ')?'; // Raw keyword with required spaces

            if (keyword.includes(' ')) {
                dealGroups += '(' + keyword.replace(' ', '') + ')?'; // Keyword without spaces
            }
        });

        let dealRegex = new RegExp(dealGroups, 'ig'); // Case insensitive and global
        if (title.includes('1660')) {
            console.log('this one');
        }

        let match = dealRegex.exec(title);

        if (match != null // TODO what the fuck is this if statement
            && match.length > 0
            && match[0] != ""
            && match[1] != null
            && match[1] != "") {
            console.log('> Found match with regex "' + dealRegex + '"');

            // XXX RichEmbeds may not exceed 25 fields.
            // (node:12060) UnhandledPromiseRejectionWarning: RangeError: RichEmbeds may not exceed 25 fields.
            // at RichEmbed.addField (..\node_modules\discord.js\src\structures\RichEmbed.js:160:41)
            if (embed.fields.length < 25) {
                embed.addField('-----------------------------------', '[' + title + '](' + scrape.data.url + ')');
            }
        }
        else {
            console.error('> No matches found with regex "' + dealRegex + '"');
        }
    });

    return embed;
}