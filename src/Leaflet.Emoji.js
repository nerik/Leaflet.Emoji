var EMPTY = '　';
L.Emoji = L.Layer.extend({
  options: {
    showGeoJSON: true,
    size: 18,
    emoji: '❓',
    emptyEmoji: EMPTY
  },

  initialize: function(geoJSON, options) {
    L.Util.setOptions(this, options);

    // simplify polygons for faster PiP
    // TODO fine tune for each each z change
    this._geoJSON = turf.simplify(geoJSON, 0.05, false);
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
      var env = turf.envelope(feature).geometry.coordinates[0];
      var envLng = env.map(ll => ll[0]);
      var envLat = env.map(ll => ll[1]);

      this._polygons.push({
        feature: feature,
        envelope: {
          wLng: Math.min.apply(Math, envLng),
          sLat: Math.min.apply(Math, envLat),
          eLng: Math.max.apply(Math, envLng),
          nLat: Math.max.apply(Math, envLat)
        }
      });
    }.bind(this));


    this._setGrid();
  //
  //   map.on('viewreset', this._updatePosition, this);
    map.on('moveend', this._setGrid, this);
  //   this._updatePosition();
  },


  getGrid() {
    return this._layer.getGrid();
  },

  copyGrid() {
    this._layer.copyGrid();
  },

  _setGrid() {
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
    var getEmoji = this._getEmojiMethod();

    for (var y = 0; y < viewportHeight; y += size) {
      var line = [];
      for (var x = 0; x < viewportWidth; x += size) {
        var ll = this._map.containerPointToLatLng([x + size/2, y + size/2]);
        var emoji = null;
        for (i = 0; i < polygonsInViewport.length; i++) {
          var feature = polygonsInViewport[i];
          var inside = turf.inside([ll.lng, ll.lat], feature);
          if (inside === true) {
            emoji = getEmoji(feature, this.options);
            break;
          }
        }
        if (!emoji) {
          emoji = getEmoji(null, this.options);
        }
        line.push(emoji);
      }
      values.push(line);
    }

    // console.log(values)

    this._layer.setGrid(values, viewportWidth, viewportHeight);
  },

  _getEmojiMethod() {
    if (typeof (this.options.emoji) === 'function') {
      return this._getEmojiFunction;
    } else if (typeof (this.options.emoji) === 'string') {
      return this._getEmojiString;
    } else if (this.options.emoji.property && this.options.emoji.values) {
      return this._getEmojiObject;
    } else {
      throw new Error('the fuck you\'re doing man');
    }
  },

  _getEmojiFunction(feature, options) {
    return options.emoji(feature);
  },

  _getEmojiString(feature, options) {
    return (feature) ? options.emoji : options.emptyEmoji;
  },

  _getEmojiObject(feature, options) {
    if (feature) {
      // debugger
      var value = feature.properties[options.emoji.property];
      if (value && options.emoji.values[value]) {
        return options.emoji.values[value];
      } else if (options.emoji.defaultValue) {
        return options.emoji.defaultValue;
      }
    } else {
      if (options.emoji.emptyValue) {
        return options.emoji.emptyValue;
      }
    }
    return EMPTY;
  }

});


var EmojiLayer = L.Layer.extend({
  initialize: function(options) {
    L.Util.setOptions(this, options);
  },

  onRemove: function() {

  },

  onAdd: function(map) {
    this._map = map;
    var div = 'div';
    var classes = 'emoji-layer leaflet-zoom-hide';
    this._el = L.DomUtil.create(div, classes);
    this._el.style.position = 'absolute';
    this._el.style.margin = 0;
    this._el.style.zIndex = 0;
    this._el.style.fontSize = this.options.size + 'px';
    this._el.style.lineHeight = this.options.size + 'px';
    this._el.innerHTML = '';

    map.getPanes().overlayPane.appendChild(this._el);

    // TODO also fire on animation?
    this._map.on('moveend', this._onMove.bind(this));
  },

  setGrid(grid, w, h) {
    this._el.style.width = w + 'px';
    this._el.style.height = h +  + 'px';

    this._grid = grid.map(line => {
      return line.join('');
    }).join('\n');

    this._el.innerHTML = this._grid;
  },

  getGrid() {
    return this._grid;
  },

  copyGrid() {
    var el = document.createElement('textarea');
    el.innerHTML = this._grid;
    el.select();

    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      console.log('Copying text command was ' + msg);
    } catch (err) {
      console.log('Oops, unable to copy');
    }
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

L.Emoji.EMPTY = EMPTY;

L.emoji = function(geoJSON, options) {
  return new L.Emoji(geoJSON, options);
};
