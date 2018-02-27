var EMPTY = '▫️';
var COLORS = Math.pow(2, 24);
var RESOLUTION = 4;

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
    showGeoJSON: false,
    size: 18,
    emoji: '❓',
    emptyEmoji: EMPTY,
    tolerance: 1
  },

  initialize: function(geoJSON, options) {
    this._getEmoji = this._getEmojiMethod(options);
    var preparedOptions = this._matchShortcodes(options);
    L.Util.setOptions(this, preparedOptions);


    // force size to be a multiple of the default resolution
    this.options.size = Math.max(RESOLUTION, Math.round(this.options.size/RESOLUTION) * RESOLUTION);
    var samplesPerCellLine = this.options.size / RESOLUTION;
    var samplesPerCell = samplesPerCellLine * this.options.size;
    this._maxEmptySamplesPerCell = samplesPerCell * this.options.tolerance;
    console.log('at most', this._maxEmptySamplesPerCell, 'empty samples should be there')

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

    this._update(this._geoJSON);

    if (this.options.showGeoJSON === false) {
      this._geoJSONRenderer._ctx.canvas.style.display = 'none';
    }


    var finalCanvas = L.DomUtil.create('canvas');
    finalCanvas.setAttribute('width', 500);
    finalCanvas.setAttribute('height', 500);
    this._finalCtx = finalCanvas.getContext('2d');
    this._finalCtx.mozImageSmoothingEnabled = false;
    this._finalCtx.webkitImageSmoothingEnabled = false;
    this._finalCtx.msImageSmoothingEnabled = false;
    this._finalCtx.imageSmoothingEnabled = false;

    this._layer = new EmojiLayer({size: this.options.size});
    this._layer.addTo(this._map);

    this._setGridAtCallStackCleared();

    this._map.on('moveend', this._setGrid, this);
  },

  update: function(geoJSON) {
    this._update(geoJSON);
    this._setGridAtCallStackCleared();
  },

  _update: function(geoJSON) {
    this._geoJSON = geoJSON;
    this._featuresByColor = {};

    if (this._geoJSONLayer) {
      this._geoJSONLayer.remove();
    }

    this._geoJSONLayer = L.geoJSON(this._geoJSON, {
      renderer: this._geoJSONRenderer,
      style: function (feature) {
        var color = '#' + Math.floor(COLORS * Math.random()).toString(16);
        this._featuresByColor[color] = feature;
        return {
          fillColor: color,
          fillOpacity: 1,
          stroke: false
        };
      }.bind(this)
    });

    this._geoJSONLayer.addTo(this._map);
  },

  getGrid: function() {
    return this._layer.getGrid();
  },

  copyGrid: function() {
    this._layer.copyGrid();
  },

  //wait for Canvas layer to render
  _setGridAtCallStackCleared: function() {
    setTimeout(this._setGrid.bind(this), 0);
  },

  _setGrid: function() {
    var size = this.options.size;

    var ctx = this._geoJSONRenderer._ctx;
    var viewportWidth = ctx.canvas.width;
    var viewportHeight = ctx.canvas.height;

    // add the extra emoji to match the exact grid size
    viewportWidth += size - (viewportWidth % size);
    viewportHeight += size - (viewportHeight % size);
    console.log('size', size)
    console.log(viewportWidth, viewportHeight)


    if (ctx === undefined) {
      console.warn('canvas renderer not initialized yet');
      return;
    }

    var t = performance.now();

    var finalWidth = viewportWidth / RESOLUTION;
    var finalHeight = viewportHeight / RESOLUTION;

    this._finalCtx.fillStyle = 'black';
    this._finalCtx.fillRect(0, 0, finalWidth, finalHeight);
    this._finalCtx.drawImage(ctx.canvas, 0, 0, viewportWidth, viewportHeight,
                                    0, 0, finalWidth, finalHeight);

    var imageData = this._finalCtx.getImageData(0, 0, finalWidth, finalHeight);

    function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? '0' + hex : hex;
    }

    function rgbToHex(r, g, b) {
      return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }


    var emojiLines = [];
    var emojiLineColors = [];
    var cellWidth = size / RESOLUTION;
    var numPixels = imageData.data.length / 4;
    var numPixelsEmojiLine = finalWidth * cellWidth;

    for (var i = 0; i < numPixels; i++) {
      var arrOffset = i * 4;
      var r = imageData.data[arrOffset];
      var g = imageData.data[arrOffset + 1];
      var b = imageData.data[arrOffset + 2];
      var rgb = rgbToHex(r, g, b);

      // get index of the pixel on the pixel line
      var linePxIndex = i % finalWidth;

      //get the cell index
      var lineCellIndex = Math.floor(linePxIndex / cellWidth);

      //if emoji cell (used to count how much time a color appears in a cell) doesn't exist yet, create
      if (!emojiLineColors[lineCellIndex]) {
        emojiLineColors[lineCellIndex] = {};
      }

      // count how much time a color appears in a cell
      if (emojiLineColors[lineCellIndex][rgb]) {
        emojiLineColors[lineCellIndex][rgb]++;
      } else {
        emojiLineColors[lineCellIndex][rgb] = 1;
      }

      if (i> 0 && i % numPixelsEmojiLine === 0) {
        var emojiLine = [];
        emojiLineColors.forEach(function (cellColors) {
          var max = 0;
          var numEmpty = 0;
          var finalColor;
          Object.keys(cellColors).forEach(function(color) {
            var num = cellColors[color];
            if (color === '#000000') {
              numEmpty = num;
            }
            if (num > max) {
              finalColor = color;
              max = num;
            }
          });
          var feature = (numEmpty < this._maxEmptySamplesPerCell) ? this._featuresByColor[finalColor] : undefined;
          var emoji = this._getEmoji(feature, this.options);
          emojiLine.push(emoji);
        }.bind(this));
        emojiLines.push(emojiLine);
        emojiLineColors = [];
      }
    }

    console.log(performance.now()- t);
    this._layer.setGrid(emojiLines, viewportWidth, viewportHeight);

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
    // this._canvas = L.DomUtil.create('canvas');
    // this._canvas.setAttribute('width', 500);
    // this._canvas.setAttribute('height', 500);
    // this._canvas.style.position = 'absolute';
    // this._canvas.style.top = 0;
    // this._canvas.style.left = 0;
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
    // document.body.appendChild(this._canvas);

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
    var mapPaneTrans = this._map._mapPane.style.transform;
    var mapPaneTransInvert = _invertTranslate3D(mapPaneTrans);
    this._el.style.transform = mapPaneTransInvert;
  }
});

var _invertTranslate3D = function(originalTransform) {
  var replacer = function (full, xStr, yStr) {
    var x = -parseInt(xStr);
    var y = -parseInt(yStr);
    return 'translate3d(' + x + 'px, ' + y + 'px, 0px)';
  };
  return originalTransform.replace(/translate3d\((-?[\d\.]+)px, (-?[\d\.]+)px.+\)/, replacer);
};


L.emoji = function(geoJSON, options) {
  return new L.Emoji(geoJSON, options);
};

L.Emoji.SHORTCODES = shortcodes;

L.Emoji.EMPTY = EMPTY;

L.Emoji.getShortcode = getShortcode;
