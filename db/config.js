const crypto = require('crypto');
const { MongoClient } = require('mongodb');

let client;
let db;

const PASSWORD_SALT = process.env.PASSWORD_SALT || 'repair-service-booking';

function hashPassword(password) {
  return crypto.pbkdf2Sync(String(password), PASSWORD_SALT, 10000, 64, 'sha512').toString('hex');
}

function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  return hashPassword(password) === hash;
}

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie || '';
  header.split(';').forEach((part) => {
    const [key, ...rest] = part.trim().split('=');
    if (key) {
      cookies[key] = decodeURIComponent(rest.join('=') || '');
    }
  });
  return cookies;
}

function setAuthCookies(res, email, role) {
  res.setHeader('Set-Cookie', [
    `authEmail=${encodeURIComponent(email)}; Path=/; HttpOnly; SameSite=Lax`,
    `authRole=${encodeURIComponent(role)}; Path=/; HttpOnly; SameSite=Lax`
  ]);
}

function clearAuthCookies(res) {
  res.setHeader('Set-Cookie', [
    'authEmail=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
    'authRole=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
  ]);
}

async function connectDb() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'repair_service_booking');

  await ensureIndexes();
  await seedIfEmpty();
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database is not connected');
  }
  return db;
}

function getCollection(name) {
  return getDb().collection(name);
}

async function ensureIndexes() {
  await getCollection('users').createIndex({ email: 1 }, { unique: true });
  await getCollection('users').createIndex({ username: 1 }, { unique: true });
  await getCollection('technicians').createIndex({ email: 1 }, { unique: true });
  await getCollection('bookings').createIndex({ id: 1 }, { unique: true });
  await getCollection('bookings').createIndex({ customerEmail: 1 });
  await getCollection('jobs').createIndex({ id: 1 }, { unique: true });
  await getCollection('jobs').createIndex({ status: 1 });
}

async function seedIfEmpty() {
  const users = getCollection('users');
  const technicians = getCollection('technicians');
  const bookings = getCollection('bookings');
  const jobs = getCollection('jobs');

  if (await users.countDocuments() === 0) {
    await users.insertOne({
      role: 'customer',
      username: 'techuser99',
      email: 'user@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+1 (555) 123-4567',
      address: '123 Tech Lane, Suite 4B, Innovation City, CA 90210',
      passwordHash: hashPassword('password'),
      createdAt: new Date()
    });
  }

  if (await technicians.countDocuments() === 0) {
    await technicians.insertOne({
      role: 'technician',
      fullName: 'John Doe',
      email: 'john.technician@fixitpro.com',
      phone: '+1 (555) 123-4567',
      specialization: 'Laptop & PC Repair',
      experience: 5,
      availability: 'available',
      address: '123 Tech Avenue, Suite 400 Silicon District, CA 90210',
      passwordHash: hashPassword('password'),
      createdAt: new Date()
    });
  }

  if (await bookings.countDocuments() === 0) {
    await bookings.insertMany([
      {
        id: 'REP-8492',
        customerEmail: 'user@example.com',
        deviceType: 'Laptop',
        deviceName: 'MacBook Pro M2',
        brand: 'Apple',
        category: 'Screen Replacement',
        date: '2024-10-24',
        displayDate: 'Oct 24, 2024',
        time: '10:00 AM',
        status: 'in-progress',
        problemDescription: 'The display has a large crack across the top and several lines running down the screen. The laptop still powers on, but the screen is difficult to use.',
        createdAt: new Date('2024-10-24')
      },
      {
        id: 'FIX-8924',
        customerEmail: 'user@example.com',
        deviceType: 'Smartphone',
        deviceName: 'Samsung Galaxy S23 Ultra',
        brand: 'Samsung',
        category: 'Screen Repair',
        date: '2023-11-15',
        displayDate: 'Nov 15, 2023',
        time: '10:00 AM',
        status: 'pending',
        problemDescription: 'The screen is cracked in the top right corner and the touch response is inconsistent near the damage. The battery also seems to be draining faster than usual even after a full charge.',
        createdAt: new Date('2023-11-15')
      },
      {
        id: 'REP-7103',
        customerEmail: 'user@example.com',
        deviceType: 'Laptop',
        deviceName: 'Dell XPS 15',
        brand: 'Dell',
        category: 'Battery Replacement',
        date: '2024-09-02',
        displayDate: 'Sep 2, 2024',
        time: '02:00 PM',
        status: 'completed',
        problemDescription: 'The laptop only lasts about 40 minutes off the charger. Battery health is reported as failing in the system diagnostics.',
        createdAt: new Date('2024-09-02')
      },
      {
        id: 'REP-6621',
        customerEmail: 'user@example.com',
        deviceType: 'Smartphone',
        deviceName: 'Samsung S22 Ultra',
        brand: 'Samsung',
        category: 'Water Damage',
        date: '2024-08-18',
        displayDate: 'Aug 18, 2024',
        time: '11:00 AM',
        status: 'cancelled',
        problemDescription: 'The phone was dropped in water and will not power on. There is visible moisture under the camera lens.',
        createdAt: new Date('2024-08-18')
      }
    ]);
  }

  if (await jobs.countDocuments() === 0) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await jobs.insertMany([
      {
        id: 'REQ-8092',
        status: 'new',
        customer: 'Jane Doe',
        customerEmail: 'user@example.com',
        device: 'MacBook Pro 16" (2021)',
        issue: 'Battery not holding charge.',
        createdAt: tenMinutesAgo
      },
      {
        id: 'JOB-8085',
        status: 'in-progress',
        customer: 'Robert Smith',
        customerEmail: 'r.smith@example.com',
        device: 'iPhone 13 Pro',
        issue: 'Screen replacement',
        location: '123 Main St, Springfield',
        deviceName: 'iPhone 13 Pro',
        deviceBrand: 'Apple',
        serialNumber: 'F92GBJ2KLP',
        notes: '',
        reportedProblem: 'Screen replacement for a cracked display.',
        schedule: {
          time: '09:00 AM - 10:30 AM',
          task: 'Screen Replacement',
          detail: 'iPhone 13 Pro (JOB-8085)'
        },
        createdAt: new Date()
      },
      {
        id: 'JOB-8081',
        status: 'completed',
        customer: 'Alice Johnson',
        customerEmail: 'alice.johnson@example.com',
        device: 'Dell XPS 15',
        issue: 'Data recovery.',
        deviceName: 'XPS 15',
        deviceBrand: 'Dell',
        serialNumber: 'DX15-8811',
        notes: 'Data recovered and copied to an external drive.',
        reportedProblem: 'Data recovery.',
        createdAt: new Date()
      },
      {
        id: 'RSB-8492',
        status: 'in-progress',
        customer: 'Sarah Jenkins',
        customerEmail: 's.jenkins@example.com',
        device: 'iPhone 13 Pro',
        issue: 'Screen is shattered',
        deviceName: 'iPhone 13 Pro',
        deviceBrand: 'Apple',
        serialNumber: 'F92GBJ2KLP',
        notes: '',
        reportedProblem: 'Screen is shattered and touch digitizer is unresponsive in the top right quadrant. Customer dropped device on concrete.',
        createdAt: new Date()
      },
      {
        id: 'SCH-1100',
        status: 'pending',
        customer: 'Walk-in diagnostic',
        device: 'Samsung Galaxy S22',
        issue: 'Diagnostics',
        schedule: {
          time: '11:00 AM - 12:00 PM',
          task: 'Diagnostics',
          detail: 'Samsung Galaxy S22'
        },
        createdAt: new Date()
      }
    ]);
  }
}

module.exports = {
  connectDb,
  getDb,
  getCollection,
  hashPassword,
  verifyPassword,
  parseCookies,
  setAuthCookies,
  clearAuthCookies
};
