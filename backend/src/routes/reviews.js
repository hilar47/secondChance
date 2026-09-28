const router = require('express').Router();
const ctrl = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common');

router.delete('/:id', authenticate, validate({ params: idParam }), ctrl.remove);

module.exports = router;
