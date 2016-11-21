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
    fetch('example/europe.geojson')
      .then(resp => resp.text())
      .then(payload => {
        console.log('loaded')
        // console.log(payload)
        L.emoji(JSON.parse(payload), { pane: 'main' }).addTo(map);
      });
  }
  window.onload = main;
})();
