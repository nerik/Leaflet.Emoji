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
        url: 'demos/data/emoji_world_borders.topo.json',
        size: 18,
        center: [50, 10],
        zoom: 4,
        emoji: function (feature) {
          if (!feature) {
            return null;
          }
          return L.Emoji.getShortcode(':flag_' + feature.properties.iso2.toLowerCase() + ':');
        },
        emojiFunctionEditableEmptyValue: L.Emoji.EMPTY
      },
      emoji_alphabets: {
        name: 'World writing systems',
        description: 'A copy-pastable map of world writing systems!',
        url: 'demos/data/emoji_world_borders.topo.json',
        size: 12,
        center: [50, 10],
        zoom: 4,
        emoji: function (feature) {
          if (!feature) {
            return null;
          }
          const country = feature.properties.iso2.toLowerCase();
          const region = feature.properties.region;
          const alphabets = {
            latin: 'abcdefghijklmnopqrstuvwxyz',
            cyrillic: 'абвгдежзийклмнопрстуфхцчшщъыьэюя',
            greek: 'αβγδεζηθικλμνξοπρστυφχψω',
            hebrew: 'אבגדהוזחטיךכלםמןנסעףפץצקרשתיִﬠﬡ',
            arabic: 'شݐݼڗڛۻﻆݠﻋﻚݧﻬێﮅﮦﯞﭫﭵࢬ',
            chinese: '且丙下丈更丁人全其刀龜瓦瓮三亼丮丩全厂勹二个又',
            hindi: 'कखगथनळउआऎहॲडझचऀॿर',
            japanese: 'あいうえおかきちにもむほふるゐゔぜぼ',
            korean: '떢떆땎똓똅렋렁롭흡흕훤홤헙햰픾퓪푞',
            thai: 'กขคฆงชฌญฏฒณทผพภมยฤฦษ',
            burmese: 'ကခဂဃငစဆဇဈဉညဋဌဍဎဏတထဓနပဖဗဘမယဩ',
            khmer: 'កខគឃងចឆជឈញដឋឌឍណតថទធនបផពភមយ',
            lao: 'ກຂຄງຈຊຍດຕຖທນບຜຝພຟມຢຣລວສຫອຮໜໝຯະ',
            ethiopic: 'ሀሄሐመሢሬሱቌቦቹኂኝኳዑዓዋጜጠ፤ፖ'
          }
          var getRandomChar = function(alphabet) { return alphabet[Math.floor(Math.random()*alphabet.length)]};
          if (region === 19 || region === 9) { // americas, oceania
            return getRandomChar(alphabets.latin);
          }
          if (region === 150) { //eurasia
            if (['ru', 'ua', 'by', 'bg'].indexOf(country) > -1) {
              return getRandomChar(alphabets.cyrillic);
            }
            if (country === 'gr') {
              return getRandomChar(alphabets.greek);
            }
            return getRandomChar(alphabets.latin);
          }
          if (region === 2) { // africa
            if (['dz','tn','ly','eg'].indexOf(country) > -1) {
              return getRandomChar(alphabets.arabic);
            }
            if (country === 'et') {
              return getRandomChar(alphabets.ethiopic);
            }
            return getRandomChar(alphabets.latin);
          }
          if (region === 142) { // asia
            if (['sa','ye','om','jo','sy','iq','ir','af','pk','ps'].indexOf(country) > -1) {
              return getRandomChar(alphabets.arabic);
            }
            if (['mn', 'kz', 'kg', 'tj'].indexOf(country) > -1) {
              return getRandomChar(alphabets.cyrillic);
            }
            if (country === 'il') {
              return getRandomChar(alphabets.hebrew);
            }
            if (country === 'in') {
              return getRandomChar(alphabets.hindi);
            }
            if (country === 'cn') {
              return getRandomChar(alphabets.chinese);
            }
            if (country === 'jp') {
              return getRandomChar(alphabets.japanese);
            }
            if (country === 'kr' || country === 'kp') {
              return getRandomChar(alphabets.korean);
            }
            if (country === 'mm') {
              return getRandomChar(alphabets.burmese);
            }
            if (country === 'th') {
              return getRandomChar(alphabets.thai);
            }
            if (country === 'kh') {
              return getRandomChar(alphabets.khmer);
            }
            return getRandomChar(alphabets.latin);
          }

          return null;
        },
        emojiFunctionEditableEmptyValue: L.Emoji.EMPTY
      },
      emoji_nfl: {
        name: 'NFL',
        description: 'Most popular NFL team by state',
        source: 'vividseats.com',
        url: 'demos/data/emoji_nfl.geojson',
        size: 18,
        center: [40, -100],
        zoom: 4,
        useGeoJSON: true,
        emoji: {
          property: 'team',
          values: {
            'New York Giants': '🗽',
            'Arizona Cardinals': '✝️',
            'San Diego Chargers': '⚡️',
            'Denver Broncos': '🐴',
            'Tampa Bay Buccaneers': '☠️',
            'San Francisco 49ers': '🔢',
            'Detroit Lions': '🦁',
            'Indianapolis Colts': '🔫',
            'Cincinnati Bengals': '🐯',
            'New Orleans Saints': '👼',
            'New England Patriots': '🇺🇸',
            'Minnesota Vikings': '🤘',
            'Carolina Panthers': '🐱',
            'Dallas Cowboys': '⭐️',
            'Green Bay Packers': '💚',
            'Pittsburgh Steelers': '🔩',
            'Washington Redskins': '🏹',
            'Seattle Seahawks': '🦅',
            'Philadelphia Eagles': '🦅',
            'Atlanta Falcons': '🦅',
            'Baltimore Ravens': '🐦',
            'Tennessee Titans': '🐭',
            'Cleveland Browns': '🐶',
            'Buffalo Bills': '🐃',
            'Kansas City Chiefs': '🐺',
            'Chicago Bears': '🐻'
          }
        }
      },
      emoji_iucn: {
        name: 'IUCN Endangered species',
        description: 'This map shows which taxonomic group has the most endangered species for each country of the world',
        legend: '🐸 amphibians<br> 🐦 birds<br> 🐟 fishes<br> 🍄 fungi<br> 🐼 mammals<br> 🐌 molluscs<br> 🌺 plants<br> 🐍 reptiles<br> 🐝 other invertebrae',
        source: 'IUCN',
        url: 'demos/data/emoji_iucn.topo.json',
        size: 18,
        center: [0, 40],
        zoom: 3,
        emoji: function (feature) {
          if (!feature) {
            return null;
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
        },
        emojiFunctionEditableEmptyValue: L.Emoji.EMPTY
      },
      emoji_us_states_hdi: {
        name: 'US States HDI',
        description: 'A modified Human Development Index for the United States.',
        legend: '😵 <4.3<br>🙁 4.3-4.6<br>😐 4.6-4.9<br>🙂 4.9-5.4<br>😃 >5.4',
        source: 'Measure of America, 2013 - 2014 dataset',
        url: 'demos/data/emoji_us_states_hdi.geojson',
        size: 18,
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
        legend: '<b>median age</b>:<br>👶 <30<br>👨 30-45<br>👴 >45<br><br><b>predominant ethnic group:</b><br>👨🏻 asian<br>👨🏼 caucasian<br>👨🏽 hispanic or latino<br>👨🏿 african american<br><br><b>summary</b><div class="biv-c"><span class="biv">&lt;35</span><span class="biv" style="left: 24px;">30-45</span><span class="biv" style="left: 48px;">&gt;45</span>👶🏻 👨🏻 👴🏻 &nbsp;&nbsp;asian<br>👶🏼 👨🏼 👴🏼 &nbsp;&nbsp;caucasian<br>👶🏽 👨🏽 👴🏽 &nbsp;&nbsp;hispanic or latino<br>👶🏿 👨🏿 👴🏿 &nbsp;&nbsp;african american</div>',
        source: 'US Census 2010',
        url: 'demos/data/emoji_nyc.topo.json',
        size: 32,
        center: [40.71, -73.98],
        zoom: 14,
        showBasemap: true,
        emoji: function (feature) {
          if (!feature) {
            return null;
          }
          var ethnicity = feature.properties.ethnic_1st;
          var medianAge = feature.properties.median_age;
          if (!ethnicity || ethnicity === 'other' || !medianAge) {
            return null;
          }

          var medianAgeIndex = 0;
          if (medianAge > 30) medianAgeIndex = 1;
          if (medianAge > 45) medianAgeIndex = 2;
          return {
            'asian': ['👶🏻', '👨🏻', '👴🏻'],
            'white': ['👶🏼', '👨🏼', '👴🏼'],
            'hispanic or latino': ['👶🏽', '👨🏽', '👴🏽'],
            'black': ['👶🏿', '👨🏿', '👴🏿']
          }[ethnicity][medianAgeIndex];
        },
        emojiFunctionEditableEmptyValue: L.Emoji.EMPTY
      },
      emoji_timezones: {
        name: 'Time zones',
        description: 'Timezones with local offsets as analog clocks emojis',
        source: 'Natural Earth',
        url: 'demos/data/emoji_timezones.topo.json',
        size: 18,
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
        },
        emojiFunctionEditableEmptyValue: L.Emoji.EMPTY
      },
      emoji_landuse: {
        name: 'Landuse of Île de Ré, France',
        legend: '🏠 residential<br> ⛱️ beach<br> 🏜 dune<br> 🌱 grassland<br> ☘️ meadow<br> 🌿 scrub/heath<br> 💧 water/basin/reservoir<br> 💦 wetland/salt pond<br> 🌳 wood/forest<br> 🏡 farm<br> 🐮 farmland<br> 🍇 vineyard<br> 🍎 orchard<br> 🌱 greenhouse<br> ⚔️ military<br> 🏭 industrial<br> 💰 commercial/retail<br> 🗿 quarry<br> ✝️ cemetery',
        source: '© OpenStreetMap contributors, European Union - SOeS, CORINE Land Cover, 2006.',
        url: 'demos/data/emoji_landuse.geo.json',
        size: 18,
        useGeoJSON: true,
        center: [46.1651,-1.3481],
        zoom: 14,
        showBasemap: false,
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

    var basemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '' });
    var labels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
      attribution: '©OpenStreetMap contributors, ©CartoDB',
      pane: 'labels'
    });

    function loadMap(mapId) {
      if (emoji) {
        emoji.remove();
        emoji = null;
      }

      history.pushState(null, null, '#' + mapId);

      var config = CONFIG[mapId];

      if (config.showBasemap === true) {
        map.addLayer(basemap);
        map.addLayer(labels);
      } else {
        map.removeLayer(basemap);
        map.removeLayer(labels);
      }

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
          geoJSON = topojson.feature(geoJSON, geoJSON.objects[(mapId === 'emoji_alphabets') ? 'emoji_world_borders' : mapId]);
        }
        emoji = L.emoji(geoJSON, config
      ).addTo(map);
      });
    }


    document.querySelector('.js-copyBtn').addEventListener('click', function() {
      if (emoji) {
        console.warn(emoji.getGrid());
        console.warn(emoji.getGridString());
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
        var optionText = document.createElement('span');
        optionText.innerHTML = config.name;
        option.appendChild(optionText);
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

    var mapId = (document.location.hash !== '') ? document.location.hash.substr(1) : 'emoji_nyc';
    loadMap(mapId);

  }
  window.onload = main;
})();
