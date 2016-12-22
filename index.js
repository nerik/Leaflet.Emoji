(function() {

  function main() {
    var mapSelector = document.querySelector('.js-mapSelector');

    var CONFIG = {
      europe_landmass: {
        url: 'example/europe.geojson',
        size: 18,
        emoji: ':sparkles:',
        showGeoJSON: true
      },
      europe_flags: {
        url: 'example/europe.geojson',
        size: 18,
        showGeoJSON: true,
        emoji: {
          property: 'admin',
          defaultValue: ':sparkles:',
          emptyValue: '🐟',
          values: {
            'France': ':fr:',
            'Germany': ':de:'
          }
        }
      }
    };

    var map = L.map('map', {
      scrollWheelZoom: false,
      center: [50, 0],
      zoom: 5
    });

    var emoji;

    // var basemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' });
    // map.addLayer(basemap);

    loadMap('europe_landmass');

    function loadMap(value) {
      if (emoji) {
        emoji.remove();
        emoji = null;
      }

      var config = CONFIG[value];

      console.log(value)
      fetch(config.url)
      .then(resp => resp.text())
      .then(payload => {
        // console.log(payload)
        emoji = L.emoji(JSON.parse(payload), config
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

    mapSelector.addEventListener('change', function(event) {
      loadMap(event.target.value);
    });
  }
  window.onload = main;
})();
