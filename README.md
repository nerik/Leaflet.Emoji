# Leaflet.emoji

<img src="https://github.com/nerik/Leaflet.Emoji/blob/master/doc/emoji.gif?raw=true">

Leaflet.emoji is a Leaflet plugin to render a layer (typically with a GeoJSON file) into a string made of emojis.

The goal is to produce copy-pastable thematic maps.

## Demo

<a href="https://nerik.github.io/Leaflet.Emoji/">Emoji maps</a>

## Future plans

- more use cases and demos
- a sandbox to quickly experiment with GeoJSON files
- support for overlapping polygons
- support for points and lines (now only support polygons)
- support for mapping from emoticons (ie, ;-))
- not only render vector, but also raster layers
- UTFGrid support?
- better performance, better approach than the current naive one, ie "point in polygon in every polygon for every grid cell"

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
