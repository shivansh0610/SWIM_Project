const express = require("express");
const morgan = require("morgan");
const fileUpload = require('express-fileupload')
const cors = require('cors')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var http = require("http");

function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
      // named pipe
      return val;
    }
    if (port >= 0) {
      // port number
      return port;
    }
    return false;
  }

let app = express();

var port = normalizePort(process.env.PORT || 7000);
app.listen(port,onListening);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload({
  // 50mb file limit
  limits: { fileSize: 50 * 1024 * 1024 },
  abortOnLimit: true
}));

app.use("/api", require("./routes/api"));
app.use("/s3", require("./routes/s3"));
app.use("/detect", require("./routes/detect"));

function onListening() {
    console.log("Listening on PORT " + port);
  }

