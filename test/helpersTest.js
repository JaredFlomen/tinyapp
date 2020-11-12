const { assert } = require('chai');
const { getUserByEmail } = require('../helperFunctions.js');

const testUsers = {
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
}

describe('getUserByEmail', function() {
  it('should return a user with a valid email', function() {
    const user = getUserByEmail(testUsers, 'user@example.com');
    const expectedOutput = 'userRandomID';
    assert.equal(user.id, expectedOutput);
  });

  it('should return undefined if the email is not in the database', function() {
    const user = getUserByEmail(testUsers, 'jared@gmail.com');
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });

});