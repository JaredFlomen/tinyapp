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

//Object to save logIn info
const usersDB = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

//Random string with 6 characters
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
};

//Logs the email, password and ID in users object
app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.send('400');
  }

  for (const user in usersDB) {
    if (usersDB[user].email === req.body.email) {
      return res.send('400');
    }
  }

  const newUser = {
    "id": generateRandomString(), 
    'email': req.body.email,
    'password': req.body.password
  };
  res.cookie('user_id', newUser["id"]);
  const key = newUser["id"];
  usersDB[key] = newUser;
  //TO TEST THAT IT'S STORED PROPERLY
  console.log(usersDB);
  //DELETE ABOVE WHEN AUTHENTICATED
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const templateVars = {
    email: null
  };
  res.render('urls_login', templateVars);
})

//A basic request that sends to the browser the string Hello! with no aditional code (ex: HTML)
app.get('/', (req, res) => {
  res.send('Hello!');
});

//Returns the register template
app.get('/register', (req, res) => {
  const templateVars = {
    email: null
  };
  res.render('urls_register', templateVars);
});

//Upon a browser request for URLs, the server sends back a database containing all URLs along with an html file for the browser to render
app.get('/urls', (req, res) => {
  const emailPass = usersDB[req.cookies['user_id']].email
  const templateVars = { urls: urlDatabase, email: emailPass };
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
  if (req.body.email === '' || req.body.password === '') {
    res.send('403');
  }

  for (const user in usersDB) {
    if (usersDB[user].email === req.body.email) {
      if (usersDB[user].password !== req.body.password) {
        return res.send('403');
      }
    }
  }

  const newUser = {
    "id": generateRandomString(), 
    'email': req.body.email,
    'password': req.body.password
  };
  res.cookie('user_id', newUser["id"]);
  const key = newUser["id"];
  usersDB[key] = newUser;
  //TO TEST THAT IT'S STORED PROPERLY
  console.log(usersDB);
  //DELETE ABOVE WHEN AUTHENTICATED
  res.redirect('/urls');


  // if (!req.body.login) {
  //   return res.redirect('/urls');
  // } else {
  //   res.cookie('username', req.body.login);
  //   return res.redirect('/urls');
  // }
});

//When clicking 'logout' button -> clear cookies
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/register');
});

//Edits a url from browser POST request
app.post('/urls/:shortURL', (req, res) => {
  if (!req.body.editURL) {
    const shortURL = req.params.shortURL
    return res.redirect(`/urls/${shortURL}`);
  } else {
    urlDatabase[req.params.shortURL] = req.body.editURL;
    return res.redirect('/urls');
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
  let emailPass = undefined;
  if (emailPass === undefined) {
    const templateVars = {
      email: undefined
    }
    return res.render('urls_new', templateVars)
  } else {
    emailPass = users[req.cookies['user_id']].email;
    const templateVars = {
      email: emailPass
    };
    return res.render('urls_new', templateVars);
  }
});

//Upon a GET request from the browser for a specific shortURL, the server sends back an html file displaying the long & short URLs 
app.get('/urls/:shortURL', (req, res) => {
  const emailPass = users[req.cookies['user_id']].email
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], email: emailPass };
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