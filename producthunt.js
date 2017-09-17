const request = require('request');
const TelegramBot = require('node-telegram-bot-api')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const TOKEN = process.env.TOKEN
const CHANNEL_CHAT_ID = process.env.CHANNEL_CHAT_ID

const bot = new TelegramBot(TOKEN)

function sendDailySummary(error, response, body){
    if (!error && response.statusCode == 200) {
        
        let message = '*TOP DAILY PRODUCTS*\n\n'

        body.posts.forEach(function(post, index) {
            message += `${index+1}. [${post.name}](${post.redirect_url}) ([${post.votes_count}](${post.discussion_url}))\n_${post.tagline}_\n`
        });

        bot.sendPhoto(CHANNEL_CHAT_ID, 'ph.png', { 
            caption: 'Loading daily #producthunt'
        }).then(() => {
            bot.sendMessage(CHANNEL_CHAT_ID, message, {
                parse_mode: 'markdown',
                disable_web_page_preview: true
            })
        })
    }
}

function getTodayPosts(error, response, body){
    if (!error && response.statusCode == 200) {

        const options = {
            url: 'https://api.producthunt.com/v1/posts',
            headers: {    
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Host': 'api.producthunt.com',
                'Authorization': `Bearer ${body.access_token}`
            },
            json: true
        };
        request(options, sendDailySummary)
    }
}

function run(){
    const options = {
        url: 'https://api.producthunt.com/v1/oauth/token',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Host': 'api.producthunt.com'
        },
        json: {
            client_id: '7a80da59a58ce2c6d8a3c657d2784192ffaba695bf801560289f44e191bb4cc2',
            client_secret: '2f151d31ac00292168366c44cd11ae47d2c8066ffe583b7472a6dffc565616e0',
            grant_type: 'client_credentials'
        }
    };
    request.post(options, getTodayPosts)    
}

module.exports = exports = run