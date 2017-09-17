const request = require('request');
const TelegramBot = require('node-telegram-bot-api')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const TOKEN = process.env.TOKEN
const CHANNEL_CHAT_ID = process.env.CHANNEL_CHAT_ID
const AMOUNT_OF_STORIES = process.env.AMOUNT_OF_HN_STORIES

const bot = new TelegramBot(TOKEN)

function sendStoriesMessage(storiesList, message, index=0){
    if(index >= storiesList.length){
        bot.sendMessage(CHANNEL_CHAT_ID, message, {
            parse_mode: 'markdown',
            disable_web_page_preview: true
        })
        return
    }

    const options = {
        url: `https://hacker-news.firebaseio.com/v0/item/${storiesList[index]}.json`,
        json: true
    };

    request(options, function nextStory(error, response, body){
        const storyTitle = body.title
        const storyURL = body.url
        const storyComments = `https://news.ycombinator.com/item?id=${body.id}`

        if(storyURL){
            message += `${index+1}. [${storyTitle}](${storyURL}) | [Comments](${storyComments})\n`
        }
        else{
            message += `${index+1}. ${storyTitle} | [Comments](${storyComments})\n`
        }
        sendStoriesMessage(storiesList, message, index+1)
    })
}

function sendDailySummary(error, response, body){
    askStories = body.slice(0, AMOUNT_OF_STORIES)
    
    bot.sendPhoto(CHANNEL_CHAT_ID, 'hn.png', {
        caption: 'Loading daily #hackernews'
    }).then(() => {
        sendStoriesMessage(topStories, '*TOP STORIES*\n');
        sendStoriesMessage(showStories, '*SHOW STORIES*\n');
        sendStoriesMessage(askStories, '*ASK STORIES*\n');
    })
}

function getAskNews(error, response, body){
    showStories = body.slice(0, AMOUNT_OF_STORIES)

    const options = {
        url: 'https://hacker-news.firebaseio.com/v0/askstories.json',
        json: true
    };
    request(options, sendDailySummary)
}

function getShowNews(error, response, body){
    topStories = body.slice(0, AMOUNT_OF_STORIES)

    const options = {
        url: 'https://hacker-news.firebaseio.com/v0/showstories.json',
        json: true
    };
    request(options, getAskNews)
}

function getTopNews(){
    const options = {
        url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
        json: true
    };
    request(options, getShowNews)
}

var topStories = []
var showStories = []
var askStories = []

getTopNews()