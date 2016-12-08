#!/usr/local/bin/node

var emojis = require('../node_modules/emoji-alpha-codes/eac.json');

var emojisByShortcodes = {};
Object.keys(emojis).forEach(function(unicode) {
  var emoji = emojis[unicode];
  var decimalUnicode = parseInt(unicode, 16);
  if (emoji.aliases) {
    emoji.aliases.split('|').forEach(function(alias) {
      emojisByShortcodes[alias] = decimalUnicode;
    });
  }
  emojisByShortcodes[emoji.alpha_code] = decimalUnicode;
});
console.log(emojisByShortcodes)
