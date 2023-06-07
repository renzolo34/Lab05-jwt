const { Router } = require('express');
const router = Router();

const jwt = require('jsonwebtoken');
const config = require('../config');
const verifyToken = require('./verifyToken');

const User = require('../models/User');

router.post('/signup', async (req, res, next) => {
  const { username, email, password, repeatPassword } = req.body;

  if (!username || !email || !password || !repeatPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== repeatPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const user = new User({
      username,
      email,
      password
    });

    user.password = await user.encryptPassword(user.password);
    await user.save();

    res.redirect('/');
  } catch (error) {
    console.log(error);
    res.status(500).send('There was a problem registering the user');
  }
});

router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId, { password: 0 });
    if (!user) {
      return res.status(404).send('No user found....!!!');
    }

    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).send('There was a problem getting user info');
  }
});

router.post('/signin', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).send("The user doesn't exists");
    }

    const validPassword = await user.validatePassword(password);

    if (!validPassword) {
      return res.status(401).json({ auth: false, token: null });
    }

    const token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 60 * 60 * 24
    });
    
    //pasamos el token por el url
    res.redirect(`/dashboard?token=${token}`);
    
  } catch (error) {
    console.log(error);
    res.status(500).send('There was a problem signing in');
  }
});

router.get('/dashboard', verifyToken, (req, res, next) => {
    res.redirect('/index.html')
});

  
module.exports = router;