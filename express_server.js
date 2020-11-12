const express = require('express');
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
  })
);

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca", 
    userID: 'userRandomID',
  },
  "9sm5xK": {
    longURL: "http://www.google.com", 
    userID: 'user2RandomID'
  },
};

const urlsForUser = function (urlDB, id) {
  let newDB = {};
  for (const i in urlDB) {
    if (urlDB[i].userID === id) {
      newDB[i] = urlDB[i];
    }
  }
  return newDB;
};

//Object to save Login information
const usersDB = {
//   "userRandomID": {
//     id: "userRandomID", 
//     email: "user@example.com", 
//     password: "purple-monkey-dinosaur"
//   },
//  "user2RandomID": {
//     id: "user2RandomID", 
//     email: "user2@example.com", 
//     password: "dishwasher-funk"
//   }
};

//Random string with 6 characters
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
};

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

  //Checks if email is already in database
  for (const user in usersDB) {
    if (usersDB[user].email === req.body.email) {
      return res.status(400).send('400');
    }
  }

  //Adds a new user if it doesn't exist
  const newUser = {
    "id": generateRandomString(), 
    'email': req.body.email,
    'password': bcrypt.hashSync(req.body.password, 10),
  };
  // res.cookie('user_id', newUser["id"]);
  req.session['user_id'] = newUser['id'];
  const key = newUser["id"];
  usersDB[key] = newUser;
  res.redirect('/urls');
});

//LOGIN BUTTON

app.get('/login', (req, res) => {
  const templateVars = {
    email: usersDB[req.cookies['user_id']]
  };
  res.render('urls_login', templateVars);
});

//Reads email and password input and if it's in the database, it sets a cookie named 'urser_id'
app.post('/login', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(403).send('403 - HERE 2');
  }
  //If wrong email, NOPE
  for (const user in usersDB) {
    if (usersDB[user].email === req.body.email) {
      // if (usersDB[user].password !== req.body.password) {
        if (!(bcrypt.compareSync(req.body.password, usersDB[user].password))){
        return res.status(403).send('403 - HERE1');
      }
      // if (usersDB[user].password === req.body.password && usersDB[user].email === req.body.email) {
        if (bcrypt.compareSync(req.body.password, usersDB[user].password) && usersDB[user].email === req.body.email){
        // res.cookie('user_id', usersDB[user]["id"]);
        req.session['user_id'] = usersDB[user]["id"];
        return res.redirect('/urls');
      }
    }
    // return res.status(403).send('403');
  }
  res.redirect('/urls');
  // for (const user in usersDB) {
  //   if (usersDB[user].email === req.body.email && usersDB[user].password === req.body.password) {
  //   }
  // }
  // let user = getUserByEmail(userDB, req.body.email);
  
  // const newUser = {
  //   "id": generateRandomString(), 
  //   'email': req.body.email,
  //   'password': req.body.password
  // };
  // res.cookie('user_id', newUser["id"]);
  // const key = newUser["id"];
  // usersDB[key] = newUser;
});

//When clicking 'logout' button -> clear cookies
app.post('/logout', (req, res) => {
  //Clears the cookie
  // res.clearCookie('user_id');
  req.session = null;
  //Redirects to registration form
  res.redirect('/register');
});

//EDIT AND DELETE BUTTONS

//Deletes a url when delete button clicked
app.post('/urls/:shortURL/delete', (req, res) => {
  let uniqueID = usersDB[req.cookies['user_id']].id;
  if (urlDatabase[req.params.shortURL].userID === uniqueID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

//Redirects to edit page when edit button is clicked
app.post('/urls/:shortURL/edit', (req, res) => {
  let uniqueID = usersDB[req.cookies['user_id']].id;
  if (urlDatabase[req.params.shortURL].userID === uniqueID) {
    urlDatabase[req.params.shortURL].longURL = req.body.editURL;
    res.redirect('/urls');
  }
});

//DATABASE WITH THE USER'S URLS

//Upon a browser request for URLs, the server sends back a database containing all URLs along with an html file for the browser to render
app.get('/urls', (req, res) => {
  const user = usersDB[req.cookies['user_id']];
  if (!user) {
    const templateVars = {
      email: undefined,
    }
    return res.render('urls_login', templateVars)
  } else {
    let emailPass = user.email;
    const superDB = urlsForUser(urlDatabase, usersDB[req.cookies['user_id']].id);
    const templateVars = { 
      urls: superDB, 
      email: emailPass,
    };
    res.render('urls_index', templateVars);
  }
});

//Browser sends a POST request with a longURL & a shortURL is generated and stored within the database with the corresponding longURL
app.post('/urls', (req, res) => {
  const randomShortURL = generateRandomString();
  const user = usersDB[req.cookies['user_id']];

  urlDatabase[randomShortURL] = {
    longURL: req.body.longURL,
    userID: user.id,
  };
  res.redirect(`/urls/${randomShortURL}`); //Redirect to new shortURL 
});

//Upon a GET request from the browser for a specific shortURL, the server sends back an html file displaying the long & short URLs 
app.get('/urls/:shortURL', (req, res) => {
  const user = usersDB[req.cookies['user_id']];
  if (!user) {
    const templateVars = {
      urls: urlDatabase,
      email: undefined
    }
    return res.render('urls_index', templateVars)
  } else {
    let emailPass = user.email;
    const templateVars = { 
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      email: emailPass, 
    };
    // urlDatabase[req.params.shortURL] = {
    //   longURL: urlDatabase[req.params.shortURL],
    //   userID: usersDB[req.cookies['user_id']].id,
    // };
    res.render('urls_show', templateVars);
  }
});

//Edits a url from browser POST request
app.post('/urls/:shortURL', (req, res) => {
  if (!req.body.editURL) {
    const shortURL = req.params.shortURL
    return res.redirect(`/urls/${shortURL}`);
  } else {
    const user = usersDB[req.cookies['user_id']];

  urlDatabase[req.params.shortURL] = {
    longURL: req.body.editURL,
    userID: user.id,
  };
    return res.redirect('/urls');
  }
});

//Renders the HTML file urls_new which promts the browser to enter a longURL to be shortened
app.get('/urls/new', (req, res) => {
  const user = usersDB[req.cookies['user_id']];
  if (!user) {
    const templateVars = { email: undefined };
    return res.render('urls_login', templateVars)
  } else {
    const templateVars = { email: user.email };
    return res.render('urls_new', templateVars);
  }
});

//Redirects the browser to the longURL, to a new website not on localHost
app.get('/u/:shortURL', (req, res) => {
  const longestURL = urlDatabase[req.params.shortURL].longURL;
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
  res.send('Hello!');
});

//Ensuring our server is listening on our PORT provided at the top of the file
app.listen(PORT, () => {
  console.log(`Example app listening on ${PORT}`);
});