#!/usr/bin/node

"use strict";

const Discord  = require('discord.js')
  , Telegram   = require('node-telegram-bot-api')
  , log        = require('winston');

const config = require('./config.json');

log.level = config.loglevel;

const tg = new Telegram(config.telegram.token, { polling: true });
const dc = new Discord.Client();

// discord messages
dc.on('ready', function(){
    log.info('[discord] connected!');
});

dc.on('diconnect', function(){
    log.warn('[discord] disconnect!... retrying');
    dc.login(config.discord.token);
});

dc.on('message', function(message){
    // ignore self
    if(message.author.id != dc.user.id) return;

    log.debug('[discord-%s-#%s]: <%s#%s> %s',
              message.channel.type, message.channel.name,
              message.author.username, message.author.discriminator,
              message.content
    );

    if (message.channel.type == 'text'
        && message.channel.id == config.discord.channel_id
        && message.guild.id == config.discord.guild_id
    ) {
        // <user#1337> what's up
        var message_out = '<' + message.author.username + '#' + message.author.discriminator + '> ' + message.content;
        tg.sendMessage(config.telegram.chat_id, message_out);
    }

});

dc.login(config.discord.token);

// telegram messages

tg.on('message', function(message){
    log.debug('[telegram-%s]: <%s> %s', message.chat.title, message.from.username, message.text);

    if (message.chat.id != config.telegram.chat_id) return;

    var target = dc.channels.get(config.discord.channel_id);

    if(!target) {
        log.warn('target channel not found: %s', config.discord.channel_id);
        return;
    }

    // <user> what's up
    var message_out = '<' + message.from.username + '> ' + message.text;
    target.sendMessage(message_out);

});
