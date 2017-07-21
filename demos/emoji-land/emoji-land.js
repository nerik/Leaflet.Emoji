import Pbf from 'pbf';
import {VectorTile} from 'vector-tile';

var emoji;

var CONFIG = {
  name: 'Landuse of Île de Ré, France',
  legend: '🏠 residential<br> ⛱️ beach<br> 🏜 dune<br> 🌱 grassland<br> ☘️ meadow<br> 🌿 scrub/heath<br> 💧 water/basin/reservoir<br> 💦 wetland/salt pond<br> 🌳 wood/forest<br> 🏡 farm<br> 🐮 farmland<br> 🍇 vineyard<br> 🍎 orchard<br> 🌱 greenhouse<br> ⚔️ military<br> 🏭 industrial<br> 💰 commercial/retail<br> 🗿 quarry<br> ✝️ cemetery',
  source: '© OpenStreetMap contributors, European Union - SOeS, CORINE Land Cover, 2006.',
  size: 18,
  showGeoJSON: true,
  emoji: {
    property: 'class',
    values: {
      'residential': '🏠',
      'beach': '⛱️',
      'dune': '🏜️',
      'grassland': '🌱',
      'grass': '🌱',
      'meadow': '☘️',
      'scrub': '🌿',
      'heath': '🌿',
      'water': '💧',
      'basin': '💧',
      'reservoir': '💧',
      'wetland': '💦',
      'salt_pond': '💦',
      'wood': '🌳',
      'forest': '🌳',
      'farm': '🏡',
      'farmland': '🐮',
      'vineyard': '🍇',
      'orchard': '🍎',
      'plant_nursery': '🌱',
      'greenhouse_horticulture': '🌱',
      'military': '⚔️',
      'industrial': '🏭',
      'commercial': '💰',
      'retail': '💰',
      'quarry': '🗿',
      'cemetery': '✝️'
    }
  }
};


var geoJSON = {
  type: 'FeatureCollection',
  features: []
};

L.VectorGrid = L.GridLayer.extend({
  options: {
    // 🍂option subdomains: String = 'abc'
    // Akin to the `subdomains` option for `L.TileLayer`.
    subdomains: 'abc',
    updateWhenIdle: true
  },
  initialize: function(url, options) {
    this.__url = url;
    L.setOptions(this, options);
  },

  _getSubdomain: L.TileLayer.prototype._getSubdomain,

  _removeTile: function(key) {
    L.GridLayer.prototype._removeTile.call(this, key);
    console.log('remove tile');
    var n = geoJSON.features.length;

    geoJSON.features = geoJSON.features.filter(function(feature) {
      return feature.properties.tileKey !== key;
    });

    console.log('-', n, 'now ', geoJSON.features.length)

  },

  createTile: function(coords, done) {

    var data = {
      s: this._getSubdomain(coords),
      x: coords.x,
      y: coords.y,
      z: coords.z
    };

    var key = this._tileCoordsToKey(coords);

    var tile = document.createElement('div');
    tile.innerHTML = [coords.x, coords.y, coords.z].join(', ');
    tile.style.outline = '1px solid red';

    var tileUrl = L.Util.template(this.__url, L.extend(data, this.options));
    var vectorTilePromise = fetch(tileUrl).then(function(response) {
      return response.blob().then( function(blob) {
        var reader = new FileReader();
        return new Promise(function(resolve) {
          reader.addEventListener('loadend', function() {
            // reader.result contains the contents of blob as a typed array
            // blob.type === 'application/x-protobuf'
            var pbf = new Pbf(reader.result);
            var vt = new VectorTile(pbf);
            return resolve(vt);
          });
          reader.readAsArrayBuffer(blob);
        });
      });
    }).catch(function() {
      console.warn('decoding tile went wrong');
    }).then(function(json){
      for (var layerName in json.layers) {
        if (['landcover','landuse','water'].indexOf(layerName) === -1) {
          delete json.layers[layerName];
          continue;
        }

        for (var i=0; i<json.layers[layerName].length; i++) {
          var feature = json.layers[layerName].feature(i);
          feature.properties.tileKey = key;
          var geoJSONFeature = feature.toGeoJSON(coords.x, coords.y, coords.z);
          geoJSON.features.push(geoJSONFeature);
        }
      }

      return geoJSON;
    }.bind(this));

    vectorTilePromise.then(function(geoJSON) {
      tile.geoJSON = geoJSON;
      done();
    }.bind(this));
    return tile;
  }
});
var map = L.map('map', {    });
map.createPane('labels');
map.getPane('labels').style.zIndex = 650;
map.getPane('labels').style.pointerEvents = 'none';
// var basemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '' });
var labels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
  attribution: '©CartoDB',
  pane: 'labels'
});
map.setView([46.1651,-1.3481], 14);
// map.addLayer(basemap);
map.addLayer(labels);

var url = 'https://free-0.tilehosting.com/data/v3/{z}/{x}/{y}.pbf.pict?key=iRnITVgsmrfcoqyulHKd';
var vectorTileOptions = {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};
var vectorGrid = new L.VectorGrid(url, vectorTileOptions).addTo(map);

vectorGrid.on('tileloadstart', function() {
  // console.log('tileloadstart', arguments)
});
vectorGrid.on('tileload', function() {
  if (emoji) {
    emoji.remove();
    emoji = null;
  }
  //
  var n = performance.now()
  emoji = L.emoji(geoJSON, CONFIG).addTo(map);
  // console.log('tileload', tile.geoJSON, tile.uid);
  console.log(performance.now() - n)
});

vectorGrid.on('tileunload', function() {
  // console.log('tileunload', tile, tile.uid,tile.geoJSON, JSON.stringify(tile.geoJSON));
});
