# Reddit Shopper

A scraper capable of monitoring multiple subreddits for posts related to the sale of items with specific price ceilings.

## Table of Contents

- [Download](#download)
- [Setup](#setup)
    * [Create a Reddit script through your account](#create-a-reddit-script-through-your-account)
    * [Configure Reddit Shopper](#configure-reddit-shopper)
- [Run the app](#run-the-app)

## Download

1. Download and install these required applications using the default installation settings
    1. [Git](https://git-scm.com/downloads)
    2. [Node.js](https://nodejs.org/en/)
    2. Open a file explorer and navigate to the directory in which you'd like to install Quest Check.
3. Open a GitBash terminal by right-clicking -- GitBash should be an option in the context menu.
4. Execute these commands
    1. `git clone git@github.com:jseashell/reddit-shopper.git`
    2. `cd reddit-shopper`
    3. `npm install`

## Setup

### Create a Reddit script through your account

1. Create an App in https://www.reddit.com/prefs/apps/
    * Type should be `script`
    * `redirect uri` does not matter but you have to fill it in with something
2. Take note of the App ID (a jumble of alphanumeric characters underneath the App's name and description, near the `change icon` link)
3. Take note of he App Secret (another jumble of alphanumeric characters but at least this one has a label)

### Configure Reddit Shopper

1. Open `./config/config.json`
2. Paste your App ID into empty quotes for `reddit_app_id: "",`
3. Paste your App Secret into empty quotes for `reddit_app_secret: "",`
4. Open `./config/subreddits.csv` and set your subreddits.
5. Open `./config/deals.csv/` and set the deals you're looking for (search term and highest price acceptable, aka price ceiling)

## Run the app

1. Execute the command `npm start` from the `reddit-shopper` directory

## License

Reddit Shopper is licensed under [GNU GPLv3](LICENSE.md). Briefly state, the GNU GPLv3 lets people do almost anything they want with Reddit Shopper, like modify and use, with the exception distributing closed source versions.