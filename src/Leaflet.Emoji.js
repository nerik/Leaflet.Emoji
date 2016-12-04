L.Emoji = L.GeoJSON.extend({
  initialize: function(geoJSON) {
    console.log(geoJSON);

    // simplify polygons for faster PiP
    // TODO fine tune for each each z change
    var simplified = turf.simplify(geoJSON, 0.05, false);

    L.GeoJSON.prototype.initialize.call(this, simplified);


  },
  onAdd: function(map) {
    L.GeoJSON.prototype.onAdd.call(this, map);
  //   console.log('added')
  //   this._map = map;
  //
    // this._layerElement = L.DomUtil.create('div', '.someClass leaflet-zoom-hide');
    // console.log(this._layerElement)
    // this._layerElement.innerHTML = 'lala';
    // map._container.appendChild(this._layerElement);

    // var germany;
    // keys.forEach(function(k,i) {
    //   // console.log(this._layers[k].feature.properties.admin, i)
    //   if(this._layers[k].feature.properties.admin === 'Germany') {
    //     germany = this._layers[k].feature;
    //   }
    // }.bind(this))
    // var country =


    this._map = map;

    this._layer = new EmojiLayer();
    this._layer.addTo(this._map);

    // get polygons envelope
    this._layerKeys = Object.keys(this._layers);
    this._polygons = [];
    this._layerKeys.forEach(function(k) {
      var layer = this._layers[k].feature;
      var env = turf.envelope(layer).geometry.coordinates[0];
      var envLng = env.map(ll => ll[0]);
      var envLat = env.map(ll => ll[1]);

      this._polygons.push({
        layer: layer,
        envelope: {
          wLng: Math.min.apply(Math, envLng),
          sLat: Math.min.apply(Math, envLat),
          eLng: Math.max.apply(Math, envLng),
          nLat: Math.max.apply(Math, envLat)
        }
      });
    }.bind(this));


    this._getGrid();
  //
  //   map.on('viewreset', this._updatePosition, this);
    map.on('moveend', this._getGrid, this);
  //   this._updatePosition();
  },

  _getGrid() {
    var polygonsInViewport = [];
    var viewportNW = this._map.containerPointToLatLng([0, 0]);
    var viewportSE = this._map.containerPointToLatLng([400, 800]);


    for (var i = 0; i < this._polygons.length; i++) {
      var poly = this._polygons[i];
      if ( !(poly.envelope.eLng < viewportNW.lng ||
        poly.envelope.wLng > viewportSE.lng ||
        poly.envelope.sLat > viewportNW.lat ||
        poly.envelope.nLat < viewportSE.lat)) {
        polygonsInViewport.push(poly.layer);
      }
    }
    var values = [];
    for (var y = 0; y < 800; y += 20) {
      for (var x = 0; x < 400; x += 20) {
        // console.log(x, y)
        var ll = this._map.containerPointToLatLng([x + 10, y + 10]);
        var value = null;
        for (i = 0; i < polygonsInViewport.length; i++) {
          var layer = polygonsInViewport[i];
          var inside = turf.inside([ll.lng, ll.lat], layer);
          if (inside === true) {
            value = layer.properties.admin;
            break;
          }
        }
        values.push(value);

      }
    }

    // console.log(values)

    this._layer.setGrid(values);
  }
  //
  // _updatePosition: function(p) {
  //   console.log('update pos');
  // }
});

var EmojiLayer = L.Layer.extend({
  initialize: function(options) {

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
    this._el.style.width = '100vw';
    this._el.style.height = '100vh';
    this._el.style.fontSize = '20px';
    this._el.style.lineHeight = '20px';
    this._el.innerHTML = '😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄';

    map.getPanes().overlayPane.appendChild(this._el);

    // TODO also fire on animation
    this._map.on('move', this._onMove.bind(this));
  },

  setGrid(grid) {
    console.log(this);
    var str = grid.map(v => v === null ? '💩' : '😄').join('');
    console.log(str);

    this._el.innerHTML = str;
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

L.emoji = function(options) {
  return new L.Emoji(options);
};
