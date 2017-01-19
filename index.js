(function() {

  function main() {
    var mapSelector = document.querySelector('.js-mapSelector');

    var CONFIG = {
      emoji_world_borders: {
        name: 'World flags',
        description: 'A copy-pastable map of world flags!',
        url: 'example/data/emoji_world_borders.topo.json',
        size: 18,
        showGeoJSON: false,
        center: [50, 0],
        zoom: 5,
        emoji: function (feature) {
          if (!feature) {
            return L.Emoji.EMPTY;
          }
          return L.Emoji.getShortcode(':flag_' + feature.properties.iso2.toLowerCase() + ':');
        }
      },
      emoji_iucn: {
        name: 'IUCN Red list',
        description: 'TBD',
        url: 'example/data/emoji_iucn.topo.json',
        size: 18,
        showGeoJSON: false,
        center: [0, 40],
        zoom: 3,
        emoji: function (feature) {
          if (!feature) {
            return L.Emoji.EMPTY;
          }
          var max = 0;
          var maxType;
          Object.keys(feature.properties).forEach(function(type) {
            var value = feature.properties[type];
            if (type !== 'cartodb_id' && typeof value === 'number') {
              if (value > max) {
                maxType = type;
                max = value;
              }
            }
          });
          return {
            amphibians: '🐸',
            birds: '🐦',
            fishes: '🐟',
            fungi_protists: '🍄',
            mammals: '🐼',
            molluscs: '🐌',
            plants: '🌺',
            reptiles: '🐍',
            other_inverts: '🐝'
          }[maxType];
        }
      },
      emoji_nyc: {
        name: 'NY Census',
        description: 'TBD',
        url: 'example/data/emoji_nyc.topo.json',
        size: 30,
        showGeoJSON: false,
        center: [40.65, -73.94],
        zoom: 13,
        emoji: function (feature) {
          if (!feature) {
            return L.Emoji.EMPTY;
          }
          var ethnicity = feature.properties.ethnic_1st;
          var medianAge = feature.properties.median_age;
          if (!ethnicity || ethnicity === 'other' || !medianAge) {
            return L.Emoji.EMPTY;
          }

          var medianAgeIndex = 0;
          if (medianAge > 30) medianAgeIndex = 1;
          if (medianAge > 45) medianAgeIndex = 2;
          return {
            'white': ['👶🏻', '👨🏻', '👴🏻'],
            'hispanic or latino': ['👶🏽', '👨🏽', '👴🏽'],
            'black': ['👶🏿', '👨🏿', '👴🏿'],
            'asian': ['👶', '👨', '👴']
          }[ethnicity][medianAgeIndex];
        }
      },
      emoji_timezones: {
        name: 'Time zones',
        description: 'TBD',
        url: 'example/data/emoji_timezones.topo.json',
        size: 18,
        showGeoJSON: true,
        center: [40, 100],
        zoom: 3,
        emoji: function (feature) {
          // console.log(feature)
          if (!feature) {
            return L.Emoji.EMPTY;
          }
          // console.log(parseFloat(feature.properties.name))
          var hour = parseFloat(feature.properties.name);
          hour = (hour >= 0) ? hour : Math.abs(hour);
          if (hour === 0) {
            hour = 12;
          }
          var shortcode = ':clock' + hour + ':';
          if (hour % 1 !== 0) {
            shortcode = ':clock' + Math.ceil(hour) + '30:';
          }
          return L.Emoji.getShortcode(shortcode);
        }
      },
      emoji_landuse: {
        name: 'Landover of the Île de Ré',
        description: '',
        url: 'example/data/emoji_landuse.geo.json',
        size: 18,
        useGeoJSON: true,
        showGeoJSON: false,
        center: [46.1651,-1.3481],
        zoom: 14,
        emoji: {
          property: 'natural_landuse',
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
      }
    };

    var map = L.map('map', {
      scrollWheelZoom: false
    });
    map.createPane('labels');
    map.getPane('labels').style.zIndex = 650;
    map.getPane('labels').style.pointerEvents = 'none';

    var emoji;

    var basemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' });
    map.addLayer(basemap);
    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
      attribution: '©OpenStreetMap, ©CartoDB',
      pane: 'labels'
    }).addTo(map);

    function loadMap(mapId) {
      if (emoji) {
        emoji.remove();
        emoji = null;
      }

      var config = CONFIG[mapId];

      mapSelector.selectedIndex = Object.keys(CONFIG).indexOf(mapId);

      document.querySelector('.js-name').innerHTML = 'Emoji maps: ' + config.name;
      document.querySelector('.js-description').innerHTML = config.description;

      map.setView(config.center, config.zoom);

      fetch(config.url)
      .then(resp => resp.text())
      .then(payload => {
        var geoJSON = JSON.parse(payload);
        if (config.useGeoJSON !== true) {
          geoJSON = topojson.feature(geoJSON, geoJSON.objects[mapId]);
        }
        emoji = L.emoji(geoJSON, config
      ).addTo(map);
      });
    }


    document.querySelector('.js-copyBtn').addEventListener('click', function() {
      if (emoji) {
        console.log(emoji.getGrid());
        emoji.copyGrid();
      }
    });

    // fill map selector values using config
    Object.keys(CONFIG).forEach(function(mapId) {
      var config = CONFIG[mapId];
      var option = document.createElement('option');
      option.setAttribute('value', mapId);
      option.innerHTML = config.name;
      mapSelector.appendChild(option);
    });

    mapSelector.addEventListener('change', function(event) {
      loadMap(event.target.value);
    });

    loadMap('emoji_landuse');

  }
  window.onload = main;
})();
