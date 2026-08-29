const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const path = require('path');

const { connectDb } = require('./db/config');
const routes = require('./route');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'ejs');

app.use(routes);

app.use((req, res) => {
  res.status(404).send('Page not found');
});

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB');
    console.error(error.message);
    process.exit(1);
  });
