var EMPTY = '　';

import turfinside from '@turf/inside';
import turfenvelope from '@turf/envelope';
import shortcodes from './shortcodes';

var getShortcode = function(emoji) {
  var shortcode = L.Emoji.SHORTCODES[emoji];
  if (shortcode) {
    return String.fromCodePoint.apply(null, shortcode);
  }
  return emoji;
};

L.Emoji = L.Layer.extend({
  options: {
    showGeoJSON: true,
    size: 18,
    emoji: '❓',
    emptyEmoji: EMPTY
  },

  initialize: function(geoJSON, options) {
    this._getEmoji = this._getEmojiMethod(options);
    var preparedOptions = this._matchShortcodes(options);
    L.Util.setOptions(this, preparedOptions);

    // simplify polygons for faster PiP
    // TODO fine tune for each each z change
    this._geoJSON = geoJSON;
    // this._geoJSON = turf.simplify(geoJSON, 0.05, false);
  },

  onRemove: function() {
    if (this._geoJSONLayer) {
      this._geoJSONLayer.remove();
    }
    this._layer.remove();
    this._map.off('moveend', this._setGrid, this);
  },

  onAdd: function(map) {
    this._map = map;

    if (this.options.showGeoJSON) {
      this._geoJSONLayer = L.geoJSON(this._geoJSON, {
        style: function () {
          return {color: 'rgba(50, 50, 50, 0.5)', weight: 1, fill: false};
        }
      });
      this._geoJSONLayer.addTo(this._map);
    }

    this._layer = new EmojiLayer({size: this.options.size});
    this._layer.addTo(this._map);

    // get polygons envelope
    this._polygons = [];
    this._geoJSON.features.forEach(function(feature) {
      if (feature.geometry) {
        var env = turfenvelope(feature).geometry.coordinates[0];
        var envLng = env.map(function(ll) { return ll[0]; });
        var envLat = env.map(function(ll) { return ll[1]; });

        this._polygons.push({
          feature: feature,
          envelope: {
            wLng: Math.min.apply(Math, envLng),
            sLat: Math.min.apply(Math, envLat),
            eLng: Math.max.apply(Math, envLng),
            nLat: Math.max.apply(Math, envLat)
          }
        });
      }
    }.bind(this));

    this._setGrid();
    this._map.on('moveend', this._setGrid, this);
  },

  getGrid: function() {
    return this._layer.getGrid();
  },

  copyGrid: function() {
    this._layer.copyGrid();
  },

  _setGrid: function() {
    var polygonsInViewport = [];

    var size = this.options.size;

    var computedStyle = window.getComputedStyle(this._map._container);
    var viewportWidth = parseFloat(computedStyle.width);
    var viewportHeight = parseFloat(computedStyle.height);

    // add the extra emoji to match the exact grid size
    viewportWidth += size - (viewportWidth % size);
    viewportHeight += size - (viewportHeight % size);

    var viewportNW = this._map.containerPointToLatLng([0, 0]);
    var viewportSE = this._map.containerPointToLatLng([viewportWidth, viewportHeight]);
    for (var i = 0; i < this._polygons.length; i++) {
      var poly = this._polygons[i];
      if ( !(poly.envelope.eLng < viewportNW.lng ||
        poly.envelope.wLng > viewportSE.lng ||
        poly.envelope.sLat > viewportNW.lat ||
        poly.envelope.nLat < viewportSE.lat)) {
        polygonsInViewport.push(poly.feature);
      }
    }

    var values = [];

    for (var y = 0; y < viewportHeight; y += size) {
      var line = [];
      for (var x = 0; x < viewportWidth; x += size) {
        var ll = this._map.containerPointToLatLng([x + size/2, y + size/2]);
        var emoji = null;
        for (i = 0; i < polygonsInViewport.length; i++) {
          var feature = polygonsInViewport[i];
          var inside = turfinside([ll.lng, ll.lat], feature);
          if (inside === true) {
            emoji = this._getEmoji(feature, this.options);
            break;
          }
        }
        if (!emoji) {
          emoji = this._getEmoji(null, this.options);
        }
        line.push(emoji);
      }
      values.push(line);
    }

    // console.log(values)

    this._layer.setGrid(values, viewportWidth, viewportHeight);
  },

  _getEmojiMethod: function(options) {
    if (typeof (options.emoji) === 'function') {
      return this._getEmojiFunction;
    } else if (typeof (options.emoji) === 'string') {
      return this._getEmojiString;
    } else if (options.emoji.property && (options.emoji.values || options.emoji.classes)) {
      return this._getEmojiObject;
    } else {
      throw new Error('the fuck you\'re doing man');
    }
  },

  _getEmojiFunction: function(feature, options) {
    return options.emoji(feature);
  },

  _getEmojiString: function(feature, options) {
    return (feature) ? options.emoji : options.emptyEmoji;
  },

  _getEmojiObject: function(feature, options) {
    if (feature) {
      var value = feature.properties[options.emoji.property];
      if (value !== undefined) {
        if (options.emoji.values) {
          if (options.emoji.values[value]) {
            return options.emoji.values[value];
          } else {
            if (options.emoji.defaultValue) {
              return options.emoji.defaultValue;
            }
          }
        }
        else if (options.emoji.classes) {
          return this._getClassFromValue(value, options.emoji.classes);
        }
      } else if (options.emoji.defaultValue) {
        return options.emoji.defaultValue;
      }
    } else {
      if (options.emoji.emptyValue) {
        return options.emoji.emptyValue;
      }
    }
    return EMPTY;
  },

  _getClassFromValue: function(value, classes) {
    for (var i = 0; i < classes.breaks.length; i++) {
      if (value < classes.breaks[i]) {
        return classes.emojis[i];
      }
    }
    return classes.emojis[classes.emojis.length - 1];
  },

  _matchShortcodes: function(options) {
    if (typeof (options.emoji) === 'string') {
      options.emoji = getShortcode(options.emoji);
    } else if (options.emoji.property && options.emoji.values) {
      Object.keys(options.emoji.values).forEach(function(value) {
        options.emoji.values[value] = this._getShortcode(options.emoji.values[value]);
      }.bind(this));

      if (options.emoji.defaultValue) {
        options.emoji.defaultValue = this._getShortcode(options.emoji.defaultValue);
      }
      if (options.emoji.emptyValue) {
        options.emoji.emptyValue = this._getShortcode(options.emoji.emptyValue);
      }
    }

    return options;
  },

  _getShortcode: function(emoji) {
    var shortcode = L.Emoji.SHORTCODES[emoji];
    if (shortcode) {
      return String.fromCodePoint.apply(null, shortcode);
    }
    return emoji;
  }
});


var EmojiLayer = L.Layer.extend({

  initialize: function(options) {
    L.Util.setOptions(this, options);
  },

  onRemove: function() {
    this._map.off('moveend', this._onMove, this);
    this._map.getPanes().overlayPane.removeChild(this._el);
  },

  onAdd: function(map) {
    this._map = map;
    var classes = 'leaflet-emoji leaflet-zoom-hide';
    this._el = L.DomUtil.create('textarea', classes);
    this._el.style.position = 'absolute';
    this._el.style.margin = 0;
    this._el.style.zIndex = 0;
    this._el.style.fontSize = this.options.size + 'px';
    this._el.style.lineHeight = 1;
    this._el.style.background = 'none';
    this._el.style.border = 'none';
    this._el.innerHTML = '';
    //http://stackoverflow.com/questions/18259090/textarea-word-wrap-only-on-line-breaks
    this._el.setAttribute('wrap', 'off');

    this._map.getPanes().overlayPane.appendChild(this._el);

    // TODO also fire on animation?
    this._map.on('moveend', this._onMove, this);
  },

  setGrid: function(grid, w, h) {
    this._el.style.width = w + 'px';
    this._el.style.height = h + 'px';

    this._grid = grid.map(function(line) {
      return line.join('');
    }).join('\n');

    this._el.innerHTML = this._grid;
  },

  getGrid: function() {
    return this._grid;
  },

  copyGrid: function() {
    this._el.select();
    document.execCommand('copy');
    this._el.selectionStart = this._el.selectionEnd = -1;
  },

  _onMove: function() {
    this._el.style.transform = _invertTranslate3D(this._map._mapPane.style.transform);
  }
});

var _invertTranslate3D = function(originalTransform) {
  var replacer = function (full, xStr, yStr) {
    var x = -parseInt(xStr);
    var y = -parseInt(yStr);
    return 'translate3d(' + x + 'px, ' + y + 'px, 0px)';
  };
  return originalTransform.replace(/translate3d\((-?\d+)px, (-?\d+)px.+\)/, replacer);
};


L.emoji = function(geoJSON, options) {
  return new L.Emoji(geoJSON, options);
};

L.Emoji.SHORTCODES = shortcodes;

L.Emoji.EMPTY = EMPTY;

L.Emoji.getShortcode = getShortcode;
