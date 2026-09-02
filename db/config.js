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

  await assignIndexes();
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

async function assignIndexes() {
  await getCollection('users').createIndex({ email: 1 }, { unique: true });
  await getCollection('users').createIndex({ username: 1 }, { unique: true });
  await getCollection('technicians').createIndex({ email: 1 }, { unique: true });
  await getCollection('bookings').createIndex({ id: 1 }, { unique: true });
  await getCollection('bookings').createIndex({ customerEmail: 1 });
  await getCollection('jobs').createIndex({ id: 1 }, { unique: true });
  await getCollection('jobs').createIndex({ status: 1 });
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
