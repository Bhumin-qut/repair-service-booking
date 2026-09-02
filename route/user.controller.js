const {
  getCollection,
  hashPassword,
  verifyPassword,
  setAuthCookies,
  clearAuthCookies
} = require('../db/config');
const { trim } = require('../helper/helperLib');

//customer and technician
async function findAccountByEmail(email) {
  const customer = await getCollection('users').findOne({ email });
  if (customer) {
    return { account: customer, role: 'customer' };
  }

  const technician = await getCollection('technicians').findOne({ email });
  if (technician) {
    return { account: technician, role: 'technician' };
  }

  return { account: null, role: null };
}

//customer and technician
exports.getLogin = (req, res) => {
  res.render('login', { title: 'Sign In', error: null });
};

//customer and technician
exports.postLogin = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const { account, role } = await findAccountByEmail(email);

    if (!account || !verifyPassword(password, account.passwordHash)) {
      return res.render('login', {
        title: 'Sign In',
        error: 'Invalid email or password.'
      });
    }

    setAuthCookies(res, account.email, role);
    if (role === 'technician') {
      return res.redirect('/technician/dashboard');
    }
    return res.redirect('/bookings');
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).send('Unable to sign in.');
  }
};

//customer
exports.getRegister = (req, res) => {
  res.render('register', { title: 'Create an Account', error: null, values: {} });
};

//customer
exports.postRegister = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      phone,
      address
    } = req.body;
    const values = { username, email, firstName, lastName, phone, address };

    const users = getCollection('users');
    const normalizedEmail = (email || '').trim().toLowerCase();
    const existing = await users.findOne({
      $or: [{ email: normalizedEmail }, { username }]
    });

    if (existing) {
      return res.render('register', {
        title: 'Create an Account',
        error: 'Username or email is already in use.',
        values
      });
    }

    await users.insertOne({
      role: 'customer',
      username: trim(username),
      email: normalizedEmail,
      firstName: trim(firstName),
      lastName: trim(lastName),
      phone: trim(phone),
      address: trim(address),
      passwordHash: hashPassword(password),
      createdAt: new Date()
    });

    setAuthCookies(res, normalizedEmail, 'customer');
    return res.redirect('/bookings');
  } catch (error) {
    console.error('Registration failed:', error);
    return res.status(500).send('Unable to create account.');
  }
};

//customer and technician
exports.getForgotPassword = (req, res) => {
  res.render('forgot-password', {
    title: 'Forgot Password',
    sent: false
  });
};

//customer and technician
exports.sendResetLink = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const { account, role } = await findAccountByEmail(email);

    if (account) {
      const collectionName = role === 'technician' ? 'technicians' : 'users';
      await getCollection(collectionName).updateOne(
        { email },
        {
          $set: {
            passwordResetRequestedAt: new Date()
          }
        }
      );
    }

    return res.render('forgot-password', {
      title: 'Forgot Password',
      sent: true,
      email
    });
  } catch (error) {
    console.error('Forgot password failed:', error);
    return res.status(500).send('Unable to process reset request.');
  }
};

// customer
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;

    return res.render('update-profile', {
      title: 'Update Profile',
      currentPage: 'profile',
      user: {
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address
        },
      error: null
    });
  } catch (error) {
    console.error('Load profile failed:', error);
    return res.status(500).send('Unable to load profile.');
  }
};

//customer
exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { firstName, lastName, phone, address, newPassword, confirmPassword } = req.body;
    const update = {
      firstName: trim(firstName),
      lastName: trim(lastName),
      phone: trim(phone),
      address: trim(address),
      updatedAt: new Date()
    };

    if (newPassword) {
      update.passwordHash = hashPassword(newPassword);
    }

    await getCollection('users').updateOne({ _id: user._id }, { $set: update });
    setAuthCookies(res, user.email, 'customer');
    return res.redirect('/profile');
  } catch (error) {
    console.error('Update profile failed:', error);
    return res.status(500).send('Unable to update profile.');
  }
};

// customer and technician
exports.logout = (req, res) => {
  clearAuthCookies(res);
  res.redirect('/login');
};
