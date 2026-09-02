# Repair Service Booking

This is booking device repairs. Customers create and track bookings. Technicians accept jobs, add notes, and mark repairs complete.
**Local URL:** http://localhost:3000  

---

## 1. Features
### Authentication
- Register, log in, log out

### Customer
- Create a repair booking (device, brand, service category, date, time, problem)
- View booking history and booking details
- Update or cancel a booking (pending or in progress)

### Technician
- Dashboard
- Accept or reject a job
- Update repair notes and mark a job complete

### System
- Role-based access (customer vs technician)
- the wrong role are redirected to `/login`
- Data stored in MongoDB (`users`, `technicians`, `bookings`, `jobs`)
- Client form validation
- Seeded demo accounts on first empty database

---

## 2. What needs to install

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Server | Express 5 |
| Views | EJS |
| UI | Bootstrap 5, Bootstrap Icons |
| Database | MongoDB |
| Config | `dotenv` |

---

## 3. Architecture summary

```
Browser
  └── Express (index.js)
        ├── Static files     public/
        ├── Views            view/*.ejs
        ├── Routes           route/index.js
        │     ├── user.controller.js
        │     ├── booking.controller.js
        │     └── technician.controller.js
        ├── Auth             middelware/middelware.js
        ├── Helpers          helper/helperLib.js
        └── MongoDB          db/config.js
              ├── users
              ├── technicians
              ├── bookings
              └── jobs
```

- `index.js` loads environment variables, connects to MongoDB, then listens on port **3000**.
- `route/index.js` maps URLs to controllers.
- Auth uses HttpOnly cookies: `authEmail` and `authRole`.
- Creating a booking inserts a **booking** status is pending.
- Technician accept / complete updates the related job.
- Password hashes use PBKDF2. Do not commit `MONGODB_URI` or other secrets.

### Main routes

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET/POST | `/login` | public | Sign in |
| GET/POST | `/register` | public | Customer registration |
| GET | `/logout` | public | Clear cookies |
| GET/POST | `/book-repair` | customer | Create booking |
| GET | `/bookings` | customer | History |
| GET | `/bookings/:id` | customer | Details |
| GET/POST | `/bookings/:id/edit` | customer | Update booking |
| POST | `/bookings/:id/cancel` | customer | Cancel |
| GET | `/technician/dashboard` | technician | Dashboard |
| GET | `/technician/bookings` | technician | Job list |
| POST | `/technician/bookings/:id/accept` | technician | Accept job |
| GET/POST | `/technician/bookings/:id` | technician | View / update job |
---

## 4. Local setup

### Prerequisites
- Node.js 18 or later
- A MongoDB Atlas cluster and a connection string

### Steps

```bash
git clone https://github.com/Bhumin-qut/repair-service-booking.git
cd repair-service-booking
npm install
```

Start the app:
```bash
npm start
```

Open http://localhost:3000  
The home route redirects to `/login`.

If the `users` or `technicians` collections are empty, demo accounts are created automatically.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | `user@example.com` | `password` |
| Technician | `john.technician@fixitpro.com` | `password` |

---

## 5. Project structure

```
Repair Service Booking/
├── index.js              
├── package.json
├── .env                   
├── db/
│   └── config.js            
├── middelware/
│   └── middelware.js        
├── helper/
│   └── helperLib.js         
├── route/
│   ├── index.js             
│   ├── user.controller.js
│   ├── booking.controller.js
│   └── technician.controller.js
├── view/                    
├── public/
│   ├── css/
│   ├── js/
│   └── uploads/technicians/
└── README.md
```

---

## 6. Manual EC2 deployment

CI/CD is out of scope. Manual deploy is enough.

1. Launch an Ubuntu (or Amazon Linux) EC2 instance.
2. Security group: allow **22** only from your IP; allow **80**. Open **3000** only if you run the app on that port without a reverse proxy.
3. SSH in. Install Node.js 18+.
4. Clone this repository. Run `npm install`.
5. Create `.env` on the server with `MONGODB_URI` and `MONGODB_DB`. Never commit `.env`.
6. Start the process so it stays up during marking, for example:

```bash
sudo npm install -g pm2
pm2 start index.js --name repair-booking
pm2 save
pm2 startup
```
---

## 7. Known limitations

- No payment or invoicing
- Forgot-password screen does not send real email
- No admin role
- Auth is cookie-based for this sample, not a full session
- Folder name `middelware` use for identify user role
- Seeded jobs are sample data, new customer bookings create matching jobs
- GitHub Actions workflow in this repo is not required for marking

---
