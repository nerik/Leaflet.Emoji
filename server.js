const tilelive = require('@mapbox/tilelive');
const app = require('express')();
const http = require('http');
require('@mapbox/mbtiles').registerProtocols(tilelive);
// require("tilelive-modules/loader")(tilelive);

const mbtileFile = process.argv.length >= 3 ? process.argv[2] : 'data/belgium.mbtiles';
console.log(`loading ${mbtileFile}`)

tilelive.load(`mbtiles://./${mbtileFile}`, function(err, source) {
  if (err) {
    console.log(err)
    throw err;
  }

  app.set('port', 7070);

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  app.get(`/:z/:x/:y.pbf`, function(req, res){
    var z = req.params.z;
    var x = req.params.x;
    var y = req.params.y;

    console.log('get tile %d, %d, %d', z, x, y);

    source.getTile(z, x, y, function(err, tile, headers) {
      if (err) {
        res.status(404)
        res.send(err.message);
        console.log(err.message);
      } else {
        res.set(headers);
        res.send(tile);
      }
    });
  });

  http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
  });
})
