(function() {

  function main() {
    var earth = document.querySelector('.js-earth');
    var currentEarth = 0;
    setInterval(function() {
      earth.innerHTML = ['🌎', '🌍', '🌏'][currentEarth];
      currentEarth = (currentEarth === 2) ? 0 : currentEarth + 1;
    }, 300);

    var mapSelector = document.querySelector('.js-mapSelector');
    var mapSelectorTitle = document.querySelector('.js-mapSelectorTitle');

    var CONFIG = {
      emoji_world_borders: {
        name: 'World flags',
        description: 'A copy-pastable map of world flags!',
        source: 'Natural Earth',
        url: 'example/data/emoji_world_borders.topo.json',
        size: 18,
        showGeoJSON: false,
        center: [50, 10],
        zoom: 4,
        emoji: function (feature) {
          if (!feature) {
            return L.Emoji.EMPTY;
          }
          return L.Emoji.getShortcode(':flag_' + feature.properties.iso2.toLowerCase() + ':');
        }
      },
      emoji_iucn: {
        name: 'IUCN Endangered species',
        description: 'This map shows which taxonomic group has the most endangered species for each country of the world',
        legend: '🐸 amphibians<br> 🐦 birds<br> 🐟 fishes<br> 🍄 fungi<br> 🐼 mammals<br> 🐌 molluscs<br> 🌺 plants<br> 🐍 reptiles<br> 🐝 other invertebrae',
        source: 'IUCN',
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
      emoji_us_states_hdi: {
        name: 'US States HDI',
        description: 'A modified Human Development Index for the United States.',
        legend: '😵 <4.3<br>🙁 4.3-4.6<br>😐 4.6-4.9<br>🙂 4.9-5.4<br>😃 >5.4',
        source: 'Measure of America, 2013 - 2014 dataset',
        url: 'example/data/emoji_us_states_hdi.geojson',
        size: 18,
        showGeoJSON: true,
        useGeoJSON: true,
        center: [38, -85],
        zoom: 5,
        emoji: {
          property: 'hdi_2013',
          classes: {
            'breaks': [    4.3, 4.6, 4.9, 5.4    ],
            'emojis': ['😵', '🙁', '😐', '🙂', '😃']
          }
        }
      },
      emoji_nyc: {
        name: 'Manhattan and Brooklyn Census',
        description: '<b>median age</b>:<br>👶 <30<br>👨 30-45<br>👴 >45<br><br><b>predominant ethnic group:</b><br>👨🏻 caucasian<br>👨🏽 hispanic or latino<br>👨🏿 african american<br>👨 asian',
        source: 'US Census 2010',
        url: 'example/data/emoji_nyc.topo.json',
        size: 30,
        showGeoJSON: false,
        center: [40.71, -73.98],
        zoom: 14,
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
        description: 'Timezones with local offsets as analog clocks emojis',
        source: 'Natural Earth',
        url: 'example/data/emoji_timezones.topo.json',
        size: 18,
        showGeoJSON: true,
        center: [40, 0],
        zoom: 3,
        emoji: function (feature) {
          if (!feature) {
            return L.Emoji.EMPTY;
          }
          var hour = parseFloat(feature.properties.name);
          hour = (hour >= 0) ? hour : 12 + hour;
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
        name: 'Landuse of Île de Ré, France',
        legend: '🏠 residential<br> ⛱️ beach<br> 🏜 dune<br> 🌱 grassland<br> ☘️ meadow<br> 🌿 scrub/heath<br> 💧 water/basin/reservoir<br> 💦 wetland/salt pond<br> 🌳 wood/forest<br> 🏡 farm<br> 🐮 farmland<br> 🍇 vineyard<br> 🍎 orchard<br> 🌱 greenhouse<br> ⚔️ military<br> 🏭 industrial<br> 💰 commercial/retail<br> 🗿 quarry<br> ✝️ cemetery',
        source: '© OpenStreetMap contributors, European Union - SOeS, CORINE Land Cover, 2006.',
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

      history.pushState(null, null, '#' + mapId);

      var config = CONFIG[mapId];

      mapSelector.selectedIndex = Object.keys(CONFIG).filter(function(key) {
        return CONFIG[key].hide !== true;
      }).indexOf(mapId);

      mapSelectorTitle.innerHTML = config.name + ' ▼';
      document.querySelector('.js-description').innerHTML = (config.description) ? config.description : '';
      document.querySelector('.js-legend').innerHTML = (config.legend) ? config.legend : '';
      document.querySelector('.js-source').innerHTML = 'Source: ' + config.source;

      map.setView(config.center, config.zoom);

      fetch(config.url)
      .then(function(resp) {
        return resp.text();
      })
      .then(function(payload) {
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
      if (config.hide !== true) {
        var option = document.createElement('div');
        option.className = 'mapSelectorItem';
        option.setAttribute('data-value', mapId);
        option.innerHTML = config.name;
        mapSelector.appendChild(option);
      }
    });

    mapSelector.addEventListener('click', function(event) {
      loadMap(event.target.getAttribute('data-value'));
      mapSelector.classList.toggle('-expanded');
    });
    mapSelectorTitle.addEventListener('click', function() {
      mapSelector.classList.toggle('-expanded');
    });

    var mapId = (document.location.hash !== '') ? document.location.hash.substr(1) : 'emoji_world_borders';
    loadMap(mapId);

  }
  window.onload = main;
})();
