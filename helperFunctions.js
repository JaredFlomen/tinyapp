const urlsForUser = function (urlDB, id) {
  let newDB = {};
  for (const i in urlDB) {
    if (urlDB[i].userID === id) {
      newDB[i] = urlDB[i];
    }
  }
  return newDB;
};

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
};

module.exports = { urlsForUser, generateRandomString };