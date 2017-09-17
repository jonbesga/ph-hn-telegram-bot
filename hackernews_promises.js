const request = require('request');
const TelegramBot = require('node-telegram-bot-api')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const TOKEN = process.env.TOKEN
const CHANNEL_CHAT_ID = process.env.CHANNEL_CHAT_ID
const AMOUNT_OF_STORIES = process.env.AMOUNT_OF_HN_STORIES

const bot = new TelegramBot(TOKEN)

function generateStoriesMessage(storiesList, premessage=''){
    return new Promise(function(resolve, reject){
        allPromises = []
        
        storiesList.forEach(function(story, index) {
            const storyPromise = generateStoryMessage(story, index)
            allPromises.push(storyPromise)
        });
        Promise.all(allPromises).then((values) => {
            const total = premessage + values.join('\n')
            resolve(total)
        }).catch(reason => { 
            reject()
        });
    })
}

function generateStoryMessage(story, index){
    return new Promise(function(resolve, reject){
        const options = {
            url: `https://hacker-news.firebaseio.com/v0/item/${story}.json`,
            json: true
        };
    
        request(options, function nextStory(error, response, body){
            if(error){ reject(); }
            const storyTitle = body.title
            const storyURL = body.url
            const storyComments = `https://news.ycombinator.com/item?id=${body.id}`
            
            if(storyURL){
                message = `${index+1}. [${storyTitle}](${storyURL}) | [Comments](${storyComments})`
            }
            else{
                message = `${index+1}. ${storyTitle} | [Comments](${storyComments})`
            }
            resolve(message, index)
        })
    })
}

function requestPromise(storyType){
    return new Promise(function(resolve, reject){
        const options = {
            url: `https://hacker-news.firebaseio.com/v0/${storyType}stories.json`,
            json: true
        };
        request(options, (error, response, body) => {
            if(error){ reject(); }

            stories = body.slice(0, AMOUNT_OF_STORIES)
            resolve(stories)
        })
    })
}

function run(){
    requestPromise('top').then((stories) => {
        const topStories = stories
    
        requestPromise('show').then((stories) => {
            const showStories = stories
    
            requestPromise('ask').then((stories) => {
                const askStories = stories

                generateStoriesMessage(topStories, '*TOP STORIES*\n').then((topMessage) => {
                    generateStoriesMessage(showStories, '*SHOW STORIES*\n').then((showMessage) => {
                        generateStoriesMessage(askStories, '*ASK STORIES*\n').then((askMessage) => {
                            
                            bot.sendPhoto(CHANNEL_CHAT_ID, 'hn.png', {
                                caption: 'Loading daily #hackernews'
                            }).then(() => {
                                bot.sendMessage(CHANNEL_CHAT_ID, topMessage, {
                                    parse_mode: 'markdown',
                                    disable_web_page_preview: true
                                }).then(() => {
                                    bot.sendMessage(CHANNEL_CHAT_ID, showMessage, {
                                        parse_mode: 'markdown',
                                        disable_web_page_preview: true
                                    }).then(() => {
                                        bot.sendMessage(CHANNEL_CHAT_ID, askMessage, {
                                            parse_mode: 'markdown',
                                            disable_web_page_preview: true
                                        })
                                    })
                                })
                            })
                        })
                    })  
                })
            })
        })
    })
}

run()
module.exports = exports = run