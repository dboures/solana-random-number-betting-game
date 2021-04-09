const initEscrow = require("./utils/initEscrow.js").initEscrow;
const swap = require("./utils/swap.js").swap;

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

app.post('/api/swap', async function (req, res) {
  let swapResult = await swap(req.body);
  return res.send(swapResult);
});

app.post('/api/init', async function (req, res) {
  let initResult = await initEscrow(req.body);
  console.log('init complete');
  return res.send(initResult);

});

app.listen(process.env.PORT || 3001);