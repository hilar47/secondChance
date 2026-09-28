const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/auth');

router.post('/register', validate({ body: v.register }), ctrl.register);
router.post('/login', validate({ body: v.login }), ctrl.login);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
