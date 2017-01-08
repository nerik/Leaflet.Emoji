(function() {

  function main() {
    var mapSelector = document.querySelector('.js-mapSelector');

    var CONFIG = {
      emoji_world_borders: {
        name: 'World flags',
        url: 'example/data/emoji_world_borders.topo.json',
        size: 18,
        showGeoJSON: false,
        center: [50, 0],
        zoom: 5,
        emoji: function (feature) {
          // console.log(feature)
          if (feature) {
            // return '🐟';
            return L.Emoji.getShortcode(':flag_' + feature.properties.iso2.toLowerCase() + ':')
          } else {
            return L.Emoji.EMPTY;
          }
        }
      }
    };

    var map = L.map('map', {
      scrollWheelZoom: false
    });

    var emoji;

    // var basemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' });
    // map.addLayer(basemap);

    loadMap('emoji_world_borders');

    function loadMap(mapId) {
      if (emoji) {
        emoji.remove();
        emoji = null;
      }

      var config = CONFIG[mapId];

      map.setView(config.center, config.zoom);

      fetch(config.url)
      .then(resp => resp.text())
      .then(payload => {
        var topoJSON = JSON.parse(payload);
        var geoJSON = topojson.feature(topoJSON, topoJSON.objects[mapId]);
        emoji = L.emoji(geoJSON, config
          // {
          // showGeoJSON: true,
          // size: 18,
          // // emoji: ':sparkles:'
          // emoji: {
          //   property: 'admin',
          //   // values: {
          //   //   'France': '🇫🇷',
          //   //   'Germany': '🇩🇪'
          //   // },
          //   // defaultValue: '🍉',
          //   defaultValue: ':sparkles:',
          //   // emptyValue: '🐟'
          //   emptyValue: ':thumbsup:',
          //   values: {
          //     'France': ':fr:',
          //     'Germany': ':de:'
          //   }
          // }
          // emoji: function(feature) {
          //   // console.log(feature.properties)
          //   if (!feature) {
          //     return L.Emoji.EMPTY;
          //   }
          //   if (feature.properties.admin === 'France') {
          //     return '🇫🇷';
          //   }
          //   return '🍉';
          // }
        //}
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

  }
  window.onload = main;
})();
