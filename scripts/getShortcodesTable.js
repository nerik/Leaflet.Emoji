#!/usr/local/bin/node

var emojis = require('../node_modules/emoji-alpha-codes/eac.json');

var emojisByShortcodes = {};
Object.keys(emojis).forEach(function(unicode) {
  var emoji = emojis[unicode];
  var decimalUnicodes = unicode.split('-').map(function(unicode) { return parseInt(unicode, 16); });
  if (emoji.aliases) {
    emoji.aliases.split('|').forEach(function(alias) {
      emojisByShortcodes[alias] = decimalUnicodes;
    });
  }
  emojisByShortcodes[emoji.alpha_code] = decimalUnicodes;
});
console.log(emojisByShortcodes)
