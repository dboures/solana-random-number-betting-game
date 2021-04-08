const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/', function (req, res) {
  console.log('default');
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/api/ping', function (req, res) {
  console.log('meh');
  return res.send({goo: 'pong'});
});

app.post('/api/init', function (req, res) {
  console.log(req.body);
  return res.send({boo: req.body});
});

app.listen(process.env.PORT || 3001);