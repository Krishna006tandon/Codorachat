const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from any origin
    methods: ["GET", "POST"]
  }
});

const port = 3000;

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://krishnatandon006:krishnatandon006@zenspace.63o32aq.mongodb.net/codorachat_db';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error(err));

// User Schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const User = mongoose.model('User', UserSchema);

// Middleware to parse JSON bodies
app.use(express.json());

// Register Route
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    user = new User({ username, password });
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, 'supersecretjwtkey', { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, username: user.username });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = { user: { id: user.id } };
    jwt.sign(payload, 'supersecretjwtkey', { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, username: user.username });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.get('/', (req, res) => {
  res.send('<h1>Codorachat Server</h1><p>The chat server is running. Please connect a client.</p>');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('chat message', (msg) => {
    console.log('message received:', msg);
    io.emit('chat message', msg);
  });

  // Typing indicator events
  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  socket.on('stop typing', (username) => {
    socket.broadcast.emit('stop typing', username);
  });
});

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});