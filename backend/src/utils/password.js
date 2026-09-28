const bcrypt = require('bcryptjs');
const { bcryptRounds } = require('../config/env');

const hash = (plain) => bcrypt.hash(plain, bcryptRounds);
const compare = (plain, hashed) => bcrypt.compare(plain, hashed);
// Compared against when the email is unknown so response time does not reveal
// whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', bcryptRounds);

module.exports = { hash, compare, DUMMY_HASH };
