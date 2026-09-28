const router = require('express').Router();
const items = require('../controllers/itemController');
const reviews = require('../controllers/reviewController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/items');
const rv = require('../validators/reviews');
const { idParam } = require('../validators/common');

router.get('/', validate({ query: v.listItems }), items.list);
router.get('/mine', authenticate, validate({ query: v.myItems }), items.mine); // before '/:id'
router.post('/', authenticate, validate({ body: v.createItem }), items.create);

router.get('/:id', optionalAuth, validate({ params: idParam }), items.getOne);
router.patch('/:id', authenticate, validate({ params: idParam, body: v.updateItem }), items.update);
router.delete('/:id', authenticate, validate({ params: idParam }), items.remove);

router.post('/:id/claim', authenticate, validate({ params: idParam }), items.claim);
router.post('/:id/release', authenticate, validate({ params: idParam }), items.release);
router.post('/:id/confirm', authenticate, validate({ params: idParam }), items.confirm);

router.post('/:id/reviews', authenticate, validate({ params: idParam, body: rv.createReview }), reviews.create);

module.exports = router;
