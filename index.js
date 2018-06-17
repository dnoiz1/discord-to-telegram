#!/usr/bin/env node

"use strict";

const Discord  = require('discord.js')
  , Telegram   = require('node-telegram-bot-api')
  , winston    = require('winston');

const config = require('./config.json');

const log = winston.createLogger({
    level: config.loglevel,
    transports: [
        new winston.transports.File({
            filename: 'logs/bridge.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.splat(),
                winston.format.json()
            )
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.splat(),
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

const tg = new Telegram(config.telegram.token, { polling: true });
const dc = new Discord.Client();

// discord messages
dc.on('ready', () => {
    log.info('[discord] connected!');
});

dc.on('diconnect', () => {
    log.warn('[discord] disconnect!... retrying');
    dc.login(config.discord.token);
});

dc.on('message', (message) => {
    // ignore self
    if(message.author.id == dc.user.id) return;

    log.debug('[discord] [%s-#%s]: <%s#%s> %s',
              message.channel.type, message.channel.name,
              message.author.username, message.author.discriminator,
              message.content
    );

    if (message.channel.type == 'text'
        && message.channel.id == config.discord.channel_id
        && message.guild.id == config.discord.guild_id
    ) {
        // <user#1337> what's up
        let message_out = '<' + message.author.username + '#' + message.author.discriminator + '> ' + message.content;
        tg.sendMessage(config.telegram.chat_id, message_out);
    }

});

dc.login(config.discord.token);

// telegram messages

tg.on('message', (message) => {
    log.debug('[telegram] [%s-#%d]: <%s> %s',
        message.chat.title, message.chat.id,
        message.from.username, message.text
    );

    if (message.chat.id != config.telegram.chat_id) return;

    let target = dc.channels.get(config.discord.channel_id);

    if(!target) {
        log.warn('target channel not found: %s', config.discord.channel_id);
        return;
    }

    // <user> what's up
    let message_out = '<' + message.from.username + '> ' + message.text;
    target.send(message_out);

});
