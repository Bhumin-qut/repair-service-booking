function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(value) {
  if (!value) return value;
  if (value.includes('AM') || value.includes('PM')) return value;
  const parts = value.split(':');
  const hour = Number(parts[0]);
  const minutes = parts[1] || '00';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = ((hour + 11) % 12) + 1;
  return `${String(displayHour).padStart(2, '0')}:${minutes} ${suffix}`;
}

function timeAgo(date) {
  if (!date) return '';
  const minutes = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function toCustomerView(user) {
  if (!user) return null;
  return {
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    address: user.address
  };
}

function trim(value) {
  return String(value || '').trim();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(value));
}

function isPhone(value) {
  return /^[0-9+()\-\s]{8,20}$/.test(trim(value));
}

function isUsername(value) {
  return /^[a-zA-Z0-9._-]{3,30}$/.test(trim(value));
}

function isIsoDate(value) {
  const date = trim(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return !Number.isNaN(new Date(`${date}T00:00:00`).getTime());
}

function isPastDate(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${isoDate}T00:00:00`) < today;
}

function validatePasswordPair(password, confirm, required) {
  if (!required && !password && !confirm) return null;
  if (!password || String(password).length < 8) return 'Password must be at least 8 characters.';
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

function validateLogin(body) {
  if (!isEmail(body.email)) return 'Enter a valid email address.';
  if (!trim(body.password)) return 'Password is required.';
  return null;
}

function validateRegister(body) {
  if (!isUsername(body.username)) return 'Username must be 3-30 letters, numbers, dots, hyphens, or underscores.';
  if (!isEmail(body.email)) return 'Enter a valid email address.';
  const passwordError = validatePasswordPair(body.password, body.confirmPassword, true);
  if (passwordError) return passwordError;
  if (trim(body.firstName).length < 2) return 'First name is required.';
  if (trim(body.lastName).length < 2) return 'Last name is required.';
  if (!isPhone(body.phone)) return 'Enter a valid phone number.';
  if (trim(body.address).length < 5) return 'Address is required.';
  return null;
}

function validateForgotPassword(body) {
  if (!isEmail(body.email)) return 'Enter a valid email address.';
  return null;
}

function validateCustomerProfile(body) {
  if (trim(body.firstName).length < 2) return 'First name is required.';
  if (trim(body.lastName).length < 2) return 'Last name is required.';
  if (!isPhone(body.phone)) return 'Enter a valid phone number.';
  if (trim(body.address).length < 5) return 'Address is required.';
  return validatePasswordPair(body.newPassword, body.confirmPassword, false);
}

function validateTechnicianProfile(body, specializations) {
  if (trim(body.fullName).length < 2) return 'Full name is required.';
  if (!isPhone(body.phone)) return 'Enter a valid phone number.';
  if (!specializations.includes(body.specialization)) return 'Select a valid specialization.';
  const experience = Number(body.experience);
  if (!Number.isInteger(experience) || experience < 0 || experience > 50) {
    return 'Experience must be between 0 and 50 years.';
  }
  if (!['available', 'busy', 'on-leave'].includes(body.availability)) {
    return 'Select an availability status.';
  }
  if (trim(body.address).length < 5) return 'Address is required.';
  return validatePasswordPair(body.newPassword, body.confirmPassword, false);
}

function validateCreateBooking(body, brands, categories) {
  if (!isIsoDate(body.preferredDate)) return 'Select a valid preferred date.';
  if (isPastDate(body.preferredDate)) return 'Preferred date cannot be in the past.';
  if (!trim(body.preferredTime)) return 'Preferred time is required.';
  if (trim(body.deviceName).length < 2) return 'Device name is required.';
  if (!brands.includes(body.deviceBrand)) return 'Select a valid device brand.';
  if (!categories.includes(body.serviceCategory)) return 'Select a valid service category.';
  if (trim(body.problemDescription).length < 10) return 'Describe the problem in at least 10 characters.';
  return null;
}

function validateUpdateBooking(body, timeSlots) {
  if (trim(body.problemDescription).length < 10) return 'Describe the problem in at least 10 characters.';
  if (!isIsoDate(body.bookingDate)) return 'Select a valid booking date.';
  if (isPastDate(body.bookingDate)) return 'Booking date cannot be in the past.';
  if (!timeSlots.includes(body.preferredTime)) return 'Select a valid time slot.';
  return null;
}

function validateJobUpdate(body, statuses) {
  if (trim(body.notes).length > 2000) return 'Notes must be 2000 characters or fewer.';
  if (body.action !== 'complete' && !statuses.includes(body.status)) {
    return 'Select a valid job status.';
  }
  return null;
}

module.exports = {
  formatDate,
  formatTime,
  timeAgo,
  toCustomerView,
  trim,
  validateLogin,
  validateRegister,
  validateForgotPassword,
  validateCustomerProfile,
  validateTechnicianProfile,
  validateCreateBooking,
  validateUpdateBooking,
  validateJobUpdate
};
