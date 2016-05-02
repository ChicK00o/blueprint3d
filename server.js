var finalhandler = require('finalhandler')
var http = require('http')
var serveStatic = require('serve-static')
var PORT = process.env.PORT || 3000;

// Serve up public/ftp folder
var serve = serveStatic('example', {'index': ['index.html']})

// Create server
var server = http.createServer(function(req, res){
  var done = finalhandler(req, res)
  serve(req, res, done)
})

// Listen
console.log('Server listening at: ' + PORT)
server.listen(PORT)
