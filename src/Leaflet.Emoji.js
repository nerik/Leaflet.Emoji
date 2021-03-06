var EMPTY = '◻️';
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
    debug: false,
    size: 18,
    emoji: '❓',
    emptyEmoji: EMPTY,
    emojiFunctionEditableEmptyValue: EMPTY,
    tolerance: 1,
    editable: false
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
    // console.log('at most', this._maxEmptySamplesPerCell, 'empty samples should be there')

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

    
    var finalCanvas = L.DomUtil.create('canvas');
    finalCanvas.setAttribute('width', 2000);
    finalCanvas.setAttribute('height', 2000);
    this._finalCtx = finalCanvas.getContext('2d');
    this._finalCtx.mozImageSmoothingEnabled = false;
    this._finalCtx.webkitImageSmoothingEnabled = false;
    this._finalCtx.msImageSmoothingEnabled = false;
    this._finalCtx.imageSmoothingEnabled = false;
    
    if (this.options.debug === false) {
      this._geoJSONRenderer._ctx.canvas.style.display = 'none';
    } else {      
      finalCanvas.style.position = 'absolute';
      finalCanvas.style.top = 0;
      document.body.appendChild(finalCanvas)
    }

    this._layer = new EmojiLayer(this.options);
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
        var rgb = [null, null, null];
        rgb = rgb.map(function() { return Math.floor(256 * Math.random()) })
        var colStr = rgb.join(',');
        this._featuresByColor[colStr] = feature;
        return {
          fillColor: 'rgb(' + colStr + ')',
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

  getGridString: function() {
    return this._layer.getGridString();
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
    var dpi = window.devicePixelRatio;
    var viewportWidth = ctx.canvas.width;
    var viewportHeight = ctx.canvas.height;
    var realCellSizePx = size * dpi;

    // add the extra emoji to match the exact grid size
    viewportWidth += realCellSizePx - (viewportWidth % realCellSizePx);
    viewportHeight += realCellSizePx - (viewportHeight % realCellSizePx);

    if (ctx === undefined) {
      console.warn('canvas renderer not initialized yet');
      return;
    }

    var t = performance.now();

    var finalWidth = (viewportWidth / RESOLUTION) / dpi;
    var finalHeight = (viewportHeight / RESOLUTION) / dpi;

    this._finalCtx.fillStyle = 'black';
    this._finalCtx.fillRect(0, 0, finalWidth, finalHeight);

    // the Math.min part is needed because of a Safari issue https://stackoverflow.com/questions/35500999/cropping-with-drawimage-not-working-in-safari
    this._finalCtx.drawImage(ctx.canvas, 0, 0, Math.min(ctx.canvas.width, viewportWidth), Math.min(ctx.canvas.height, viewportHeight),
                                         0, 0, finalWidth, finalHeight);

                                         
    var imageData = this._finalCtx.getImageData(0, 0, finalWidth, finalHeight);

    var emojiLines = [];
    var emojiLineColors = [];
    var cellWidth = size / RESOLUTION;
    var numPixels = (imageData.data.length / 4);
    var numPixelsEmojiLine = (finalWidth * cellWidth);

    for (var i = 0; i < numPixels; i++) {
      var arrOffset = i * 4;
      var r = imageData.data[arrOffset];
      var g = imageData.data[arrOffset + 1];
      var b = imageData.data[arrOffset + 2];
      var rgb = [r, g, b].join(',')

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
            if (color === '0,0,0') {
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
    // console.log(performance.now()- t);
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
      throw new Error('options.emoji should be a function, as string or a configuration object');
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
    return (this.options.editable === true) ? EMPTY : '';
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
    this._textarea = L.DomUtil.create('textarea', classes);
    this._map.getPanes().overlayPane.appendChild(this._textarea);

    if (this.options.editable === true) {
      this._textarea.style.position = 'absolute';
      this._textarea.style.margin = 0;
      this._textarea.style.zIndex = 0;
      this._textarea.style.background = 'none';
      this._textarea.style.border = 'none';
      // http://stackoverflow.com/questions/18259090/textarea-word-wrap-only-on-line-breaks
      this._textarea.setAttribute('wrap', 'off');
      this._el = this._textarea;
    } else {
      classes += ' -s' + this.options.size;
      this._container = L.DomUtil.create('div', classes);
      this._map.getPanes().overlayPane.appendChild(this._container);
      this._el = this._container;
      this._textarea.style.display = 'none';
    }
    this._el.style.lineHeight = 1;
    this._el.style.fontSize = this.options.size + 'px';
    this._el.innerHTML = '';

    // document.body.appendChild(this._canvas);

    // TODO also fire on animation?
    this._map.on('moveend', this._onMove, this);
  },

  setGrid: function(grid, w, h) {
    this._el.style.width = w + 'px';
    this._el.style.height = h + 'px';

    this._grid = grid;
    const editableEmptyValue = this.options.emojiFunctionEditableEmptyValue;
    this._gridString = this._grid.map(function(line) {
      return line.map(function(e) {
        return (e === null) ? editableEmptyValue : e;
      }).join('');
    }).join('\n');
    this._textarea.innerHTML = this._gridString;

    if (this.options.editable === false) {
      this._gridHTML = grid.map(function(line) {
        return line.map(function(e) {
          return '<span>' + ((e === null) ? '' : e) + '</span>'
        }).join('');
      }).join('<br>');

      this._container.innerHTML = this._gridHTML;
    }
  },

  getGrid: function() {
    return this._grid;
  },

  getGridString: function() {
    return this._gridString;
  },

  copyGrid: function() {
    this._textarea.style.display = 'block';

    this._textarea.select();
    document.execCommand('copy');
    this._textarea.selectionStart = this._el.selectionEnd = -1;

    if (this.options.editable !== true) {
       // browser blocks copying to clipboard without this
      setTimeout(function() {
        this._textarea.style.display = 'none';
      }.bind(this), 1)
    }
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
