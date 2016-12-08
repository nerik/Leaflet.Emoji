(function() {
  function main() {
    var map = L.map('map', {
      scrollWheelZoom: false,
      center: [50, 0],
      zoom: 5
    });

    var basemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' });
    map.addLayer(basemap);

    // L.emoji({
    //
    // }).addTo(map);
    var emoji;
    fetch('example/europe.geojson')
      .then(resp => resp.text())
      .then(payload => {
        // console.log(payload)
        emoji = L.emoji(JSON.parse(payload), {
          showGeoJSON: true,
          size: 18,
          // emoji: ':sparkles:'
          emoji: {
            property: 'admin',
            // values: {
            //   'France': '🇫🇷',
            //   'Germany': '🇩🇪'
            // },
            // defaultValue: '🍉',
            defaultValue: ':sparkles:',
            // emptyValue: '🐟'
            emptyValue: ':thumbsup:',
            values: {
              'France': ':fr:',
              'Germany': ':de:'
            }
          }
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
        }).addTo(map);
      });

    document.querySelector('.js-copyBtn').addEventListener('click', function() {
      console.log('copy')
      console.log(emoji.getGrid())
      emoji.copyGrid()
    })
  }
  window.onload = main;
})();
