const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { urlsForUser, generateRandomString, getUserByEmail } = require('./helperFunctions');
const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
  })
);

const urlDatabase = {};

//Object/Database to save Login information
const usersDB = {};

//REGISTER BUTTON

//Display registration template
app.get('/register', (req, res) => {
  const templateVars = { email: undefined };
  res.render('urls_register', templateVars);
});

//Logs the email, password and ID in users object
app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('400');
  }
  let inputEmail = req.body.email;
  const checkUserEmail = getUserByEmail(usersDB, inputEmail);

  //Adds a new user if it doesn't exist
  if (!checkUserEmail) {
    const newUser = {
      "id": generateRandomString(),
      'email': req.body.email,
      'password': bcrypt.hashSync(req.body.password, 10),
    };
    req.session['user_id'] = newUser['id'];
    const key = newUser["id"];
    usersDB[key] = newUser;
    res.redirect('/urls');
  } else {
    res.send("already registered");
  }
});

//LOGIN BUTTON

app.get('/login', (req, res) => {
  const templateVars = {
    email: usersDB[req.session['user_id']]
  };
  res.render('urls_login', templateVars);
});

//Reads email and password input and if it's in the database, it sets a cookie named 'urser_id'
app.post('/login', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(403).send('403');
  }
  let inputEmail = req.body.email;
  let inputPassword = req.body.password;
  const checkUserEmail = getUserByEmail(usersDB, inputEmail);
  if (checkUserEmail && bcrypt.compareSync(inputPassword, checkUserEmail.password)) {
    req.session['user_id'] = checkUserEmail.id;
    return res.redirect('/urls');
  } else {
    return res.redirect('/register');
  }
});

//When clicking 'logout' button -> clear cookies
app.post('/logout', (req, res) => {
  req.session = null;
  //Redirects to registration form
  res.redirect('/urls');
});

//EDIT AND DELETE BUTTONS

//Deletes a url when delete button clicked
app.post('/urls/:shortURL/delete', (req, res) => {
  let uniqueID = usersDB[req.session['user_id']].id;
  if (urlDatabase[req.params.shortURL].userID === uniqueID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

//Redirects to edit page when edit button is clicked
app.post('/urls/:shortURL/edit', (req, res) => {
  let uniqueID = usersDB[req.session['user_id']].id;
  if (urlDatabase[req.params.shortURL].userID === uniqueID) {
    urlDatabase[req.params.shortURL].longURL = req.body.editURL;
    res.redirect('/urls');
  }
});

//DATABASE WITH THE USER'S URLS

//Upon a browser request for URLs, the server sends back a database containing all URLs along with an html file for the browser to render
app.get('/urls', (req, res) => {
  const user = usersDB[req.session['user_id']];
  if (!user) {
    const templateVars = {
      email: undefined,
    };
    return res.render('urls_login', templateVars);
  } else {
    let emailPass = user.email;
    const superDB = urlsForUser(urlDatabase, usersDB[req.session['user_id']].id);
    const templateVars = { urls: superDB, email: emailPass };
    res.render('urls_index', templateVars);
  }
});

//Renders the HTML file urls_new which promts the browser to enter a longURL to be shortened
app.get('/urls/new', (req, res) => {
  const user = usersDB[req.session['user_id']];
  if (!user) {
    const templateVars = { email: undefined };
    return res.render('urls_login', templateVars);
  } else {
    const templateVars = { email: user.email };
    return res.render('urls_new', templateVars);
  }
});

//Browser sends a POST request with a longURL & a shortURL is generated and stored within the database with the corresponding longURL
app.post('/urls', (req, res) => {
  const randomShortURL = generateRandomString();
  const user = usersDB[req.session['user_id']];
  urlDatabase[randomShortURL] = { longURL: req.body.longURL, userID: user.id };
  //Redirects to a shortened URL
  res.redirect(`/urls/${randomShortURL}`);
});

//Upon a GET request from the browser for a specific shortURL, the server sends back an html file displaying the long & short URLs
app.get('/urls/:shortURL', (req, res) => {
  let user = usersDB[req.session['user_id']];
  let checkLong = urlDatabase[req.params.shortURL];
  console.log(checkLong.userID);
  // console.log("1: ", urlDatabase);
  // console.log("2: ", usersDB[req.session['user_id']]);
  
  if (!user) {
    return res.send('Please login!');
  } else if (checkLong.userID !== req.session['user_id']) {
    return res.send('Not yours!');
  } else {
    let emailPass = user.email;
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      email: emailPass,
    };
    res.render('urls_show', templateVars);
  }
});

//Edits a url from browser POST request
app.post('/urls/:shortURL', (req, res) => {
  if (!req.body.editURL) {
    const shortURL = req.params.shortURL;
    return res.redirect(`/urls/${shortURL}`);
  } else {
    const user = usersDB[req.session['user_id']];
    urlDatabase[req.params.shortURL] = {
      longURL: req.body.editURL,
      userID: user.id,
    };
    return res.redirect('/urls');
  }
});

//Redirects the browser to the longURL, to a new website not on localHost
app.get('/u/:shortURL', (req, res) => {
  const shortenedURL = req.params.shortURL
  const longestURL = urlDatabase[shortenedURL].longURL;
  res.redirect(longestURL);
});

//Outputs the database in JSON format
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

//HTML is sent to the client that displays Hello World
app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

//A basic request that sends to the browser the string Hello! with no aditional code (ex: HTML)
app.get('/', (req, res) => {
  let user = usersDB[req.session['user_id']];
  if (!user) {
    return res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
  // res.send('Hello!');
});

//Ensuring our server is listening on our PORT provided at the top of the file
app.listen(PORT, () => {
  console.log(`Example app listening on ${PORT}`);
});