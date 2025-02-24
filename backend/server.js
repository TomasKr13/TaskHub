const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const manageTeams = require('./routes/manageTeams'); // Importuj správně

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true, // Povolit cookies
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Nastavení session
app.use(session({
  secret: 'tvůj_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 },
}));

// Použití rout pro týmy
app.use('/api/teams', manageTeams); // Důležité: `/api/teams` je prefix, který přidáváš k routeru

// Spuštění serveru
app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
});


