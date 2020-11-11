const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Random string with 6 characters
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
};

//A basic request that sends to the browser the string Hello! with no aditional code (ex: HTML)
app.get('/', (req, res) => {
  res.send('Hello!');
});

//Returns the register template
app.get('/register', (req, res) => {
  const templateVars = {
    username: req.cookies['username']
  };
  res.render('urls_register', templateVars);
});

//Upon a browser request for URLs, the server sends back a database containing all URLs along with an html file for the browser to render
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies['username'] };
  res.render('urls_index', templateVars);
});

//Deletes a url when delete button clicked
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//Redirects to edit page
app.post('/urls/:shortURL/edit', (req, res) => {
  res.redirect('/urls');
});

//Records username input and sets to cookie named 'username'
app.post('/login', (req, res) => {
  if (!req.body.login) {
    res.redirect('/urls');
  } else {
    res.cookie('username', req.body.login);
    res.redirect('/urls');
  }
});

//When clicking 'logout' button -> clear cookies
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

//Edits a url from browser POST request
app.post('/urls/:shortURL', (req, res) => {
  if (!req.body.editURL) {
    const shortURL = req.params.shortURL
    res.redirect(`/urls/${shortURL}`);
  } else {
    urlDatabase[req.params.shortURL] = req.body.editURL;
    res.redirect('/urls');
  }
});

//Browser sends a POST request with a longURL & a shortURL is generated and stored within the database with the corresponding longURL
app.post('/urls', (req, res) => {
  const randomShortURL = generateRandomString();
  urlDatabase[randomShortURL] = req.body.longURL; //obj[key]=value
  res.redirect(`/urls/${randomShortURL}`); //Redirect to new shortURL 
});

//Renders the HTML file urls_new which promts the browser to enter a longURL to be shortened
app.get('/urls/new', (req, res) => {
  const templateVars = {
    username: req.cookies['username']
  };
  res.render('urls_new', templateVars);
});

//Upon a GET request from the browser for a specific shortURL, the server sends back an html file displaying the long & short URLs 
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies['username'] };
  res.render('urls_show', templateVars);
});

//Redirects the browser to the longURL, to a new website not on localHost
app.get('/u/:shortURL', (req, res) => {
  const longestURL = urlDatabase[req.params.shortURL];
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

//Ensuring our server is listening on our PORT provided at the top of the file
app.listen(PORT, () => {
  console.log(`Example app listening on ${PORT}`);
});