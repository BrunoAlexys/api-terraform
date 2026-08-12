const express = require('express');
const movieController = require('../controllers/MovieController');

const router = express.Router();

router.get('/', movieController.getAll);
router.get('/:id', movieController.getById);
router.post('/', movieController.create);
router.put('/:id', movieController.update);
router.delete('/:id', movieController.delete);

module.exports = router;
