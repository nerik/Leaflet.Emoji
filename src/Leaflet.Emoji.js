var EMPTY = '　';
var COLORS = Math.pow(2, 24);

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

    this._geoJSON = geoJSON;
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
    this._geoJSONRenderer = L.canvas({
      padding: 0
    });

    this._featuresByColor = {};
    var that = this;
    var n = 0;
    var c = 0;
    var t = performance.now();

    var colorByEmojis = {};
    this._emojisByColor = [];

    this._geoJSONLayer = L.geoJSON(this._geoJSON, {
      renderer: this._geoJSONRenderer,
      style: function (feature) {

        var emoji = that._getEmoji(feature, that.options);
        if (!colorByEmojis[emoji]) {
          colorByEmojis[emoji] = c;
          that._emojisByColor[c] = emoji;

          // if pixel values are too close, gives a lot of errors
          c += 10;
        }

        var hex = colorByEmojis[emoji].toString(16);
        hex = hex.length == 1 ? '0' + hex : hex;
        var color = '#' + hex + '0000';
        n++;

        // feature.properties.r = Math.floor(255 * Math.random());
        // feature.properties.g = Math.floor(255 * Math.random());
        // feature.properties.b = Math.floor(255 * Math.random());

        // var color = '#' + Math.floor(COLORS * Math.random()).toString(16);
        // that._featuresByColor[color] = feature;
        return {
          fillColor: color,
          fillOpacity: 1,
          stroke: false
        };
      }
    });
    console.log(performance.now()- t);
    console.log(colorByEmojis);

    console.log(n)
    this._geoJSONLayer.addTo(this._map);

    if (this.options.showGeoJSON) {
      // TODO make visible or not
    }

    this._layer = new EmojiLayer({size: this.options.size});
    this._layer.addTo(this._map);

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
    var size = this.options.size;

    var computedStyle = window.getComputedStyle(this._map._container);
    var viewportWidth = parseFloat(computedStyle.width);
    var viewportHeight = parseFloat(computedStyle.height);

    console.log('size', size)
    console.log(viewportWidth, viewportHeight)
    // add the extra emoji to match the exact grid size
    viewportWidth += size - (viewportWidth % size);
    viewportHeight += size - (viewportHeight % size);

    var imageData = this._geoJSONRenderer._ctx.getImageData(0, 0, viewportWidth, viewportHeight);

    this._layer._canvas.getContext('2d').putImageData(imageData, 0, 0)

    // console.log(imageData)
    // console.log(viewportWidth, viewportHeight)

    var t = performance.now();

    function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? '0' + hex : hex;
    }

    function rgbToHex(r, g, b) {
      return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    var emojiLines = [];
    var emojiLineColors = [];
    var numPixels = imageData.data.length / 4;
    var numPixelsEmojiLine = viewportWidth * size;

    // should be an exact divisor of size
    var pxIncrement = 6;


    for (var i = 0; i < numPixels; i += pxIncrement) {
      var linePxIndex = i % viewportWidth;
      var lineCellIndex = Math.floor(linePxIndex / size);
      // if (i < 20000) {
      //
      //   // console.log(lineCellIndex)
      // }

      if (!emojiLineColors[lineCellIndex]) {
        emojiLineColors[lineCellIndex] = [];
      }

      var arrOffset = i * 4;
      if (imageData.data[arrOffset + 3] > 0) {
        var r = imageData.data[arrOffset];
        // var g = imageData.data[arrOffset + 1];
        // var b = imageData.data[arrOffset + 2];
        // var rgb = rgbToHex(r, g, b);

        if (emojiLineColors[lineCellIndex][r]) {
          emojiLineColors[lineCellIndex][r]++;
        } else {
          emojiLineColors[lineCellIndex][r] = 1;
        }
      }

      if (i> 0 && i % numPixelsEmojiLine === 0) {
        // console.log('new emoji Line',  i);
        // console.log(emojiLineColors);
        var emojiLine = [];
        emojiLineColors.forEach(function (cellColors) {
          var max = 0;
          var finalColor;
          Object.keys(cellColors).forEach(function(color) {
            var num = cellColors[parseInt(color)];
            if (num > max) {
              finalColor = parseInt(color);
              max = num;
            }
          });
          // console.log(cellColors, finalColor);
          if (finalColor !== undefined && !this._emojisByColor[finalColor]) {
            console.log('!!!!', finalColor)
          }
          var emoji = (finalColor) ? this._emojisByColor[finalColor] : EMPTY;
          // var emoji = this._getEmoji(this._featuresByColor[finalColor], this.options);
          emojiLine.push(emoji);
        }.bind(this));
        emojiLines.push(emojiLine);
        emojiLineColors = [];
      }
    }
    //
    //
    //
    // function getCellColor(imageData, initOffset, cellSize, totalWidth) {
    //   var offsetPx = initOffset;
    //   var totalPx = cellSize * cellSize;
    //   var cellColors = {};
    //   for (var px = 0; px < totalPx - 20; px++) {
    //     var arrOffset = offsetPx * 4;
    //
    //     var r = imageData.data[arrOffset];
    //     var g = imageData.data[arrOffset + 1];
    //     var b = imageData.data[arrOffset + 2];
    //     var rgb = rgbToHex(r, g, b);
    //
    //     if (cellColors[rgb]) {
    //       cellColors[rgb]++;
    //     } else {
    //       cellColors[rgb] = 1;
    //     }
    //
    //     if (y % cellSize === 0) {
    //       offsetPx += totalWidth - cellSize;
    //     } else {
    //       offsetPx++;
    //     }
    //   }
    //
    //   var max = 0;
    //   var finalColor;
    //   Object.keys(cellColors).forEach(function(color) {
    //     var num = cellColors[color];
    //     if (num > max) {
    //       finalColor = color;
    //       max = num;
    //     }
    //   });
    //   console.log(cellColors, finalColor);
    //
    //   return finalColor;
    // }
    //
    // for (var y = 0; y < viewportHeight - 100; y += size) {
    //   var line = [];
    //   var rowOffset = viewportWidth * y;
    //   for (var x = 0; x < viewportWidth - 100; x += size) {
    //     var pixelOffset = rowOffset + x;
    //     var rgb = getCellColor(imageData, pixelOffset, size, viewportWidth);
    //
    //     // var r = imageData.data[arrOffset];
    //     // var g = imageData.data[arrOffset + 1];
    //     // var b = imageData.data[arrOffset + 2];
    //     // var feature = null;
    //     // var emoji = null;
    //     // if (r !== 0 && g !== 0 && b !== 0) {
    //     //   var rgb = rgbToHex(r, g, b);
    //     //   // console.log(r, g, b)
    //     //   // console.log(pixelOffset)
    //     //   feature = this._featuresByColor[rgb];
    //     // }
    //     var emoji = this._getEmoji(this._featuresByColor[rgb], this.options);
    //     line.push(emoji);
    //   }
    //   values.push(line);
    // }

    console.log(performance.now()- t);
    this._layer.setGrid(emojiLines, viewportWidth, viewportHeight);
    // console.log(emojiLines)

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
    this._canvas = L.DomUtil.create('canvas');
    this._canvas.setAttribute('width', 1200);
    this._canvas.setAttribute('height', 1200);
    this._canvas.style.position = 'absolute';
    this._canvas.style.top = 0;
    this._canvas.style.left = 0;
    console.log(this._canvas)
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
    document.body.appendChild(this._canvas);

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
