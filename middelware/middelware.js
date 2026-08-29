const { getCollection, parseCookies } = require('../db/config');

async function getLoggedInUser(req) {
  const cookies = parseCookies(req);
  const email = cookies.authEmail;
  const role = cookies.authRole;

  if (!email || !role) {
    return null;
  }

  if (role === 'customer') {
    const user = await getCollection('users').findOne({ email });
    return user ? { user, role } : null;
  }

  if (role === 'technician') {
    const user = await getCollection('technicians').findOne({ email });
    return user ? { user, role } : null;
  }

  return null;
}
async function identifyUser(req, res, next, role) {
  try {
    const auth = await getLoggedInUser(req);
    if (!auth || (role && auth.role !== role)) {
      return res.redirect('/login');
    }

    req.user = auth.user;
    req.authRole = auth.role;
    return next();
  } catch (error) {
    console.error('Identify logged-in user failed:', error);
    return res.status(500).send('Unable to authenticate.');
  }
}

exports.requireLogin = (req, res, next) => identifyUser(req, res, next);

exports.requireCustomer = (req, res, next) => identifyUser(req, res, next, 'customer');

exports.requireTechnician = (req, res, next) => identifyUser(req, res, next, 'technician');
