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
            let storyURL = body.url
            const storyComments = `https://news.ycombinator.com/item?id=${body.id}`

            if(storyURL){
                storyURL = storyURL.replace(/_/,'\\\\_')
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

async function run(){
    const topStories = await requestPromise('top')
    const showStories = await requestPromise('show')
    const askStories = await requestPromise('ask')
    
    const topMessage = await generateStoriesMessage(topStories, '*TOP STORIES*\n')
    const showMessage = await generateStoriesMessage(showStories, '*SHOW STORIES*\n')
    const askMessage = await generateStoriesMessage(askStories, '*ASK STORIES*\n')
                        
    await bot.sendPhoto(CHANNEL_CHAT_ID, 'hn.png', {
        caption: 'Loading daily #hackernews'
    })

    messageOptions = {
        parse_mode: 'markdown',
        disable_web_page_preview: true
    }
    await bot.sendMessage(CHANNEL_CHAT_ID, topMessage, messageOptions)
    await bot.sendMessage(CHANNEL_CHAT_ID, showMessage, messageOptions)
    await bot.sendMessage(CHANNEL_CHAT_ID, askMessage, messageOptions)
}

run()
