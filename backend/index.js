const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const mainPageRoutes = require('./routes/MainpageRoutes');
const manageTask = require('./routes/manageTask');
const manageTeams = require('./routes/manageTeams'); // Importuj nový router pro týmy
const chatRoutes = require('./routes/chatRoutes'); // Importuj nový router pro chat
const findUser = require('./routes/findUser'); // Importuj nový router pro vyhledávání uživatelů
const path = require('path');

dotenv.config(); // Načtení environmentálních proměnných z .env souboru

const app = express();
const PORT = process.env.PORT || 5001;


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
app.use('/api/teams', manageTeams); 
app.use('/api/chat', chatRoutes); // Přidej nový route pro chat
app.use('/api/users', findUser); // Přidej nový route pro vyhledávání uživatelů

app.use(express.static(path.join(__dirname, "build")))

app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).send("API route not found")
  }
  res.sendFile(path.join(__dirname, "build", "index.html"))
});

app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
});
