const { getCollection } = require('../db/config');
const { formatDate, formatTime, toCustomerView, trim, validateCreateBooking, validateUpdateBooking } = require('../helper/helperLib');

const brands = [
  'Apple',
  'Samsung',
  'Google',
  'Dell',
  'HP',
  'Lenovo',
  'Sony',
  'Microsoft',
  'Other'
];

const categories = [
  'Screen Repair',
  'Battery Replacement',
  'Water Damage',
  'Charging Port',
  'Software Issue',
  'Hardware Diagnostic',
  'Data Recovery',
  'Other'
];

const timeSlots = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM'
];

//customer
function canEdit(booking) {
  return booking && (booking.status === 'pending' || booking.status === 'in-progress');
}

//customer
function authLocals(user, extra) {
  return Object.assign(
    { user: toCustomerView(user), currentPage: 'bookings' },
    extra
  );
}

//customer
exports.getCreateBooking = async (req, res) => {
  try {
    const user = req.user;

    return res.render('create-booking', {
      title: 'Create New Booking',
      currentPage: 'book-repair',
      user: toCustomerView(user),
      brands,
      categories,
      error: null,
      values: {}
    });
  } catch (error) {
    console.error('Load create booking failed:', error);
    return res.status(500).send('Unable to load booking form.');
  }
};

//customer
exports.createBooking = async (req, res) => {
  try {
    const user = req.user;

    const {
      preferredDate,
      preferredTime,
      deviceName,
      deviceBrand,
      serviceCategory,
      problemDescription
    } = req.body;

    const bookingError = validateCreateBooking(req.body, brands, categories);
    if (bookingError) {
      return res.render('create-booking', {
        title: 'Create New Booking',
        currentPage: 'book-repair',
        user: toCustomerView(user),
        brands,
        categories,
        error: bookingError,
        values: req.body
      });
    }

    const bookingId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const booking = {
      id: bookingId,
      customerEmail: user.email,
      deviceType: 'Device',
      deviceName: trim(deviceName),
      brand: deviceBrand,
      category: serviceCategory,
      date: preferredDate,
      displayDate: formatDate(preferredDate),
      time: formatTime(preferredTime),
      status: 'pending',
      problemDescription: trim(problemDescription),
      createdAt: new Date()
    };

    await getCollection('bookings').insertOne(booking);
    await getCollection('jobs').insertOne({
      id: `REQ-${Math.floor(8000 + Math.random() * 900)}`,
      status: 'new',
      customer: `${user.firstName} ${user.lastName}`.trim(),
      customerEmail: user.email,
      bookingId,
      device: `${deviceBrand} ${deviceName}`.trim(),
      issue: problemDescription,
      createdAt: new Date()
    });

    return res.redirect('/bookings');
  } catch (error) {
    console.error('Create booking failed:', error);
    return res.status(500).send('Unable to create booking.');
  }
};

//customer
exports.getBookings = async (req, res) => {
  try {
    const user = req.user;

    const bookings = await getCollection('bookings')
      .find({ customerEmail: user.email })
      .sort({ createdAt: -1 })
      .toArray();

    return res.render('booking-history', authLocals(user, {
      title: 'Booking History',
      bookings
    }));
  } catch (error) {
    console.error('Load bookings failed:', error);
    return res.status(500).send('Unable to load bookings.');
  }
};

//customer
exports.getBooking = async (req, res) => {
  try {
    const user = req.user;

    const booking = await getCollection('bookings').findOne({
      id: req.params.id,
      customerEmail: user.email
    });

    if (!booking) {
      return res.status(404).send('Booking not found');
    }

    return res.render('view-booking', authLocals(user, {
      title: `Booking #${booking.id}`,
      booking,
      canEdit: canEdit(booking)
    }));
  } catch (error) {
    console.error('Load booking failed:', error);
    return res.status(500).send('Unable to load booking.');
  }
};

//customer
exports.getUpdateBooking = async (req, res) => {
  try {
    const user = req.user;

    const booking = await getCollection('bookings').findOne({
      id: req.params.id,
      customerEmail: user.email
    });

    if (!booking) {
      return res.status(404).send('Booking not found');
    }

    if (!canEdit(booking)) {
      return res.redirect(`/bookings/${booking.id}`);
    }

    return res.render('update-booking', authLocals(user, {
      title: `Update Booking #${booking.id}`,
      booking,
      timeSlots,
      error: null
    }));
  } catch (error) {
    console.error('Load update booking failed:', error);
    return res.status(500).send('Unable to load booking.');
  }
};

//customer
exports.updateBooking = async (req, res) => {
  try {
    const user = req.user;

    const booking = await getCollection('bookings').findOne({
      id: req.params.id,
      customerEmail: user.email
    });

    if (!booking) {
      return res.status(404).send('Booking not found');
    }

    const updateError = validateUpdateBooking(req.body, timeSlots);
    if (updateError) {
      return res.render('update-booking', authLocals(user, {
        title: `Update Booking #${booking.id}`,
        booking: Object.assign({}, booking, {
          problemDescription: req.body.problemDescription,
          date: req.body.bookingDate,
          time: req.body.preferredTime
        }),
        timeSlots,
        error: updateError
      }));
    }

    if (canEdit(booking)) {
      await getCollection('bookings').updateOne(
        { id: booking.id },
        {
          $set: {
            problemDescription: trim(req.body.problemDescription),
            date: req.body.bookingDate,
            displayDate: formatDate(req.body.bookingDate),
            time: req.body.preferredTime,
            updatedAt: new Date()
          }
        }
      );
    }

    return res.redirect(`/bookings/${booking.id}`);
  } catch (error) {
    console.error('Update booking failed:', error);
    return res.status(500).send('Unable to update booking.');
  }
};

//customer
exports.cancelBooking = async (req, res) => {
  try {
    const user = req.user;

    const booking = await getCollection('bookings').findOne({
      id: req.params.id,
      customerEmail: user.email
    });

    if (booking && canEdit(booking)) {
      await getCollection('bookings').updateOne(
        { id: booking.id },
        { $set: { status: 'cancelled', updatedAt: new Date() } }
      );
      await getCollection('jobs').updateMany(
        { bookingId: booking.id },
        { $set: { status: 'cancelled', updatedAt: new Date() } }
      );
    }

    return res.redirect('/bookings');
  } catch (error) {
    console.error('Cancel booking failed:', error);
    return res.status(500).send('Unable to cancel booking.');
  }
};
