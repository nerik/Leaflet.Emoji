L.Emoji = L.GeoJSON.extend({
  initialize: function(geoJSON) {
    console.log(geoJSON);

    // simplify polygons for faster PiP
    // TODO fine tune for each each z change
    var simplified = turf.simplify(geoJSON, 0.1, false);

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
    this._layer = new L.Control._EmojiStaticLayer();
    map.addControl(this._layer);


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
    console.time('test');

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
    for (var x = 0; x < 400; x += 10) {
      for (var y = 0; y < 800; y += 10) {
        // console.log(x, y)
        var ll = this._map.containerPointToLatLng([x, y]);
        var value = null;
        for (var i = 0; i < polygonsInViewport.length; i++) {
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

    console.timeEnd('test');
    console.log(values)
  }
  //
  // _updatePosition: function(p) {
  //   console.log('update pos');
  // }
});

L.Control._EmojiStaticLayer = L.Control.extend({
  options: {
    position: 'topleft'
  },

  onAdd: function () {
    var controlDiv = L.DomUtil.create('div', 'leaflet-control-emoji');
    controlDiv.style.position = 'absolute';
    controlDiv.style.margin = 0;
    controlDiv.style.zIndex = 0;
    controlDiv.style.width = '100vw';
    controlDiv.style.height = '100vh';
    controlDiv.style.fontSize = '20px';
    controlDiv.style.lineHeight = '20px';
    controlDiv.innerHTML = '😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄😄';
    // L.DomEvent
    //     .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
    //     .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
    // .addListener(controlDiv, 'click', function () { MapShowCommand(); });

    return controlDiv;
  }
});

L.emoji = function(options) {
  return new L.Emoji(options);
};
