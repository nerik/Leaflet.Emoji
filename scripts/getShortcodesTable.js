#!/usr/local/bin/node

var emojis = require('../node_modules/emoji-alpha-codes/eac.json');

var emojisByShortcodes = {};
Object.keys(emojis).forEach(function(unicode) {
  var emoji = emojis[unicode];
  if (emoji.aliases) {
    emoji.aliases.split('|').forEach(function(alias) {
      emojisByShortcodes[alias] = unicode;
    });
  }
  emojisByShortcodes[emoji.alpha_code] = unicode;
});
console.log(emojisByShortcodes)
