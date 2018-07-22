# Leaflet.emoji

Leaflet.emoji is a Leaflet plugin to render a layer into a emoji string.

 - <a href="https://nerik.github.io/Leaflet.Emoji/">Emoji Maps: thematic mapping witrh emojis <img src="https://github.com/nerik/Leaflet.Emoji/blob/master/doc/emoji_maps.png?raw=true"></a>

 - <a href="https://nerik.github.io/Leaflet.Emoji/demos/emoji-city">Emoji City: live OpenStreetMap data in emojis <img src="https://github.com/nerik/Leaflet.Emoji/blob/master/doc/emoji_city.png?raw=true"></a>

## Usage

**The plugin is currently at a "proof of concept" stage, stability and performance are not there yet and API is likely to heavily change.**


### Basic usage

```
var emoji = L.emoji(geoJSON, {
  emoji: '😊'
}).addTo(map);
```

<img src="https://github.com/nerik/Leaflet.Emoji/blob/master/doc/doc_basic_usage.png">


### Set emoji size in grid
```
var emoji = L.emoji(geoJSON, {
  emoji: '👍',
  size: 30
}).addTo(map);
```

<img src="https://github.com/nerik/Leaflet.Emoji/blob/master/doc/doc_size.png">


### Using a configuration object

```
var emoji = L.emoji(geoJSON, {
  emoji: {
    property: 'countryName',
    values: {
      'United Kingdom': '☂️'
    },
    defaultValue: '☀️️',
    emptyValue: '🐟'
  }  
}).addTo(map);
```

<img src="https://github.com/nerik/Leaflet.Emoji/blob/master/doc/doc_object.png">

- `property`: refers to the geoJSON property to be matched
- `values`: a property value - emoji hash
- `defaultValue`: the emoji to fill polygons if it doesn't match any `value`. Whitespace is rendered if omitted.
- `emptyValue`: the emoji to fill space outside all polygons. Whitespace is rendered if omitted.

### Using shortcodes
```
var emoji = L.emoji(geoJSON, {
  emoji: ':sparkles:'
}).addTo(map);
```

<img src="https://github.com/nerik/Leaflet.Emoji/blob/master/doc/doc_shortcode.png">


### Sequential scales
```
var emoji = L.emoji(geoJSON, {
  emoji: {
    property: 'hdi_2013',
    classes: {
      'breaks': [    4.3, 4.6, 4.9, 5.4    ],
      'emojis': ['😵', '🙁', '😐', '🙂', '😃']
    }
  }
}).addTo(map);
```


### Using a function
```
var emoji = L.emoji(geoJSON, {
  emoji: function (feature) {
    if (!feature) {
      return null;
    }
    return L.Emoji.getShortcode(':flag_' + feature.properties.iso2.toLowerCase() + ':');
  },
  emojiFunctionEditableEmptyValue: '◻'
}).addTo(map);
```


<img src="https://github.com/nerik/Leaflet.Emoji/blob/master/doc/doc_function.png">

`emoji` can be a function that will take the geoJSON feature as a parameter.

To render white space, return null. In `editable` mode, you will need to specify a Unicode character to fill in the blank,
by setting `emojiFunctionEditableEmptyValue` (to `L.Emoji.EMPTY` for instance)

To match a shortcode with an emoji, use `L.Emoji.getShortcode`.


### Options

__debug__ show underlying geoJSON polygons canvas.

__editable__ use copy-pastable `textarea` instead of individual `<span>`s. When set to true, `emptyEmoji` will be `

__emptyEmoji__ character used to fill in whitespace, defaults to `L.Emoji.EMPTY`
