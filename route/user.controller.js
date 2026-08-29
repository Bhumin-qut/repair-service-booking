const {
  getCollection,
  hashPassword,
  verifyPassword,
  setAuthCookies,
  clearAuthCookies
} = require('../db/config');
const { toCustomerView } = require('../helper/helperLib');

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
  res.render('register', { title: 'Create an Account', error: null });
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

    if (password !== confirmPassword) {
      return res.render('register', {
        title: 'Create an Account',
        error: 'Passwords do not match.'
      });
    }

    const users = getCollection('users');
    const normalizedEmail = (email || '').trim().toLowerCase();
    const existing = await users.findOne({
      $or: [{ email: normalizedEmail }, { username }]
    });

    if (existing) {
      return res.render('register', {
        title: 'Create an Account',
        error: 'Username or email is already in use.'
      });
    }

    await users.insertOne({
      role: 'customer',
      username,
      email: normalizedEmail,
      firstName,
      lastName,
      phone,
      address,
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
      user: toCustomerView(user)
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
      firstName,
      lastName,
      phone,
      address,
      updatedAt: new Date()
    };

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        return res.status(400).send('Passwords do not match.');
      }
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
