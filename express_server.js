const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

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

//Upon a browser request for URLs, the server sends back a database containing all URLs along with an html file for the browser to render
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

//Browser sends a POST request with a longURL & a shortURL is generated and stored within the database with the corresponding longURL
app.post('/urls', (req, res) => {
  const randomShortURL = generateRandomString();
  urlDatabase[randomShortURL] = req.body.longURL; //obj[key]=value
  // console.log(urlDatabase); --> Uncomment to test functionality
  res.redirect(`/urls/${randomShortURL}`); //Redirect to new shortURL 
});

//Renders the HTML file urls_new which promts the browser to enter a longURL to be shortened
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

//Upon a GET request from the browser for a specific shortURL, the server sends back an html file displaying the long & short URLs 
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('urls_show', templateVars);
});

//Redirects the browser to the longURL, to a new website not on localHost
app.get('/u/:shortURL', (req, res) => {
  // const shortURL = req.params.shortURL; CHECK IT WORKS *IT SHOULD*
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