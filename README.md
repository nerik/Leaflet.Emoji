# Leaflet.emoji

<img src="https://github.com/nerik/Leaflet.Emoji/blob/master/doc/emoji.gif?raw=true">

Leaflet.emoji is a Leaflet plugin to render a layer (typically with a GeoJSON file) into a string made of emojis.

The goal is to produce copy-pastable thematic maps.

## Demo

<a href="https://nerik.github.io/Leaflet.Emoji/">Emoji maps</a>

## Future plans

- more use cases and demos
- not only render GeoJSONs, but also raster layers
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
    }
    defaultValue: '☀️️',
    emptyValue: '🐟',
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

### Using a function
```
var emoji = L.emoji(geoJSON, {
  emoji: function (feature) {
    if (!feature) {
      return L.Emoji.EMPTY;
    }
    return L.Emoji.getShortcode(':flag_' + feature.properties.iso2.toLowerCase() + ':');
  }
}).addTo(map);
```

<img src="https://github.com/nerik/Leaflet.Emoji/blob/master/doc/doc_function.png">

`emoji` can be a function that will take the geoJSON feature as a parameter.

To render whitespace, use `L.Emoji.EMPTY`

To match a shortcode with an emoji, use `L.Emoji.getShortcode`.
