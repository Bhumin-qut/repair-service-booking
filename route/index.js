const express = require('express');
const { requireCustomer, requireTechnician } = require('../middelware/middelware');
const bookingController = require('./booking.controller');
const technicianController = require('./technician.controller');
const userController = require('./user.controller');

const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/login');
});

router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);
router.get('/register', userController.getRegister);
router.post('/register', userController.postRegister);
router.get('/forgot-password', userController.getForgotPassword);
router.post('/forgot-password', userController.sendResetLink);
router.get('/profile', requireCustomer, userController.getProfile);
router.post('/profile', requireCustomer, userController.updateProfile);
router.get('/logout', userController.logout);

router.get('/technician/dashboard', requireTechnician, technicianController.getDashboard);
router.get('/technician/profile', requireTechnician, technicianController.getProfile);
router.post('/technician/profile', requireTechnician, technicianController.uploadPhoto, technicianController.updateProfile);
router.get('/technician/bookings', requireTechnician, technicianController.getBookings);
router.post('/technician/bookings/:id/accept', requireTechnician, technicianController.acceptJob);
router.post('/technician/bookings/:id/reject', requireTechnician, technicianController.rejectJob);
router.get('/technician/bookings/:id', requireTechnician, technicianController.getJob);
router.post('/technician/bookings/:id', requireTechnician, technicianController.updateJob);

router.get('/book-repair', requireCustomer, bookingController.getCreateBooking);
router.post('/book-repair', requireCustomer, bookingController.createBooking);

router.get('/bookings', requireCustomer, bookingController.getBookings);
router.get('/bookings/:id/edit', requireCustomer, bookingController.getUpdateBooking);
router.post('/bookings/:id/cancel', requireCustomer, bookingController.cancelBooking);
router.get('/bookings/:id', requireCustomer, bookingController.getBooking);
router.post('/bookings/:id', requireCustomer, bookingController.updateBooking);

module.exports = router;
