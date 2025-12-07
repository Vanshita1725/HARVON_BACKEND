const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress
} = require('../Controller/addressController');

// All routes protected
router.use(protect);

router.get('/', getAddresses);
router.post('/', createAddress);
router.get('/:id', getAddressById);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);

module.exports = router;
