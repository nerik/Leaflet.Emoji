import Pbf from 'pbf';
import {VectorTile} from 'vector-tile';

L.VectorGrid = L.GridLayer.extend({
  options: {
    // 🍂option subdomains: String = 'abc'
    // Akin to the `subdomains` option for `L.TileLayer`.
    subdomains: 'abc'  // Like L.TileLayer
  },
  initialize: function(url, options) {
    this._url = url;
    L.setOptions(this, options);
  },
  _getSubdomain: L.TileLayer.prototype._getSubdomain,
  createTile: function(coords) {
    // console.log(coords);

    var data = {
      s: this._getSubdomain(coords),
      x: coords.x,
      y: coords.y,
      z: coords.z
//       z: this._getZoomForUrl()  /// TODO: Maybe replicate TileLayer's maxNativeZoom
    };

    var tileUrl = L.Util.template(this._url, L.extend(data, this.options));
    var vectorTilePromise = fetch(tileUrl).then(function(response) {
      return response.blob().then( function(blob) {
        var reader = new FileReader();
        return new Promise(function(resolve) {
          reader.addEventListener('loadend', function() {
            // reader.result contains the contents of blob as a typed array
            // blob.type === 'application/x-protobuf'
            var pbf = new Pbf( reader.result );
            return resolve(new VectorTile( pbf ));
          });
          reader.readAsArrayBuffer(blob);
        });
      });
    }).catch(function() {
      // console.log(arguments);
    }).then(function(json){

      // console.log('Vector tile:', json.layers);
      // console.log('Vector tile water:', json.layers.water);  // Instance of VectorTileLayer

      // Normalize feature getters into actual instanced features
      for (var layerName in json.layers) {
        if (['landcover','landuse','water'].indexOf(layerName) === -1) {
          delete json.layers[layerName];
          continue;
        }
        // console.log(layerName)
        var feats = [];

        for (var i=0; i<json.layers[layerName].length; i++) {
          var feat = json.layers[layerName].feature(i);
          feat.geometry = feat.loadGeometry();
          feats.push(feat);
        }

        // console.log(feats)

        json.layers[layerName].features = feats;
      }

      return json;
    });

    vectorTilePromise.then( function renderTile(vectorTile) {
      // console.log(coords)
      console.log(vectorTile)
      for (var layerName in vectorTile.layers) {
        var layer = vectorTile.layers[layerName];
        var pxPerExtent = this.getTileSize().divideBy(layer.extent);
        console.log(this.getTileSize(), layer.extent, pxPerExtent)
      }
    }.bind(this));

    // done();
    return L.DomUtil.create('div', '');
  }
});
var map = L.map('map', {    });
map.createPane('labels');
map.getPane('labels').style.zIndex = 650;
map.getPane('labels').style.pointerEvents = 'none';
var basemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' });
var labels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
  attribution: '©OpenStreetMap, ©CartoDB',
  pane: 'labels'
});
map.setView([46.1651,-1.3481], 14);
map.addLayer(basemap);
map.addLayer(labels);

var url = 'https://free-0.tilehosting.com/data/v3/{z}/{x}/{y}.pbf.pict?key=iRnITVgsmrfcoqyulHKd';
var vectorTileOptions = {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};
new L.VectorGrid(url, vectorTileOptions).addTo(map);
