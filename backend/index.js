const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const mainPageRoutes = require('./routes/MainpageRoutes');
const manageTask = require('./routes/manageTask');
const manageTeams = require('./routes/manageTeams'); // Importuj nový router pro týmy

dotenv.config(); // Načtení environmentálních proměnných z .env souboru

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true, // Povolit cookies
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Nastavení session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Použijte `true`, pokud používáte HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 den
  },
}));

// Registrace rout
app.use('/api/auth', authRoutes); 
app.use('/api/main', mainPageRoutes);
app.use('/api/manage', manageTask);
app.use('/api/teams', manageTeams); // Přidej nový route pro týmy

app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
});
