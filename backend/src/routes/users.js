const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/auth');
const { idParam, pagination } = require('../validators/common');

router.patch('/me', authenticate, validate({ body: v.updateProfile }), ctrl.updateMe);
router.get('/:id', validate({ params: idParam }), ctrl.getProfile);
router.get('/:id/reviews', validate({ params: idParam, query: pagination }), ctrl.listReviews);

module.exports = router;
