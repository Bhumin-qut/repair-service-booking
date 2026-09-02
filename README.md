# Repair Service Booking

Web application for booking device repairs. Customers create and track bookings. Technicians accept jobs, add notes, and mark repairs complete.

**Repository:** https://github.com/Bhumin-qut/repair-service-booking.git  
**Local URL:** http://localhost:3000  
**Deployment URL:** _Add your public EC2 URL here after deploy (for example `http://x.x.x.x:3000`)._

---

## 1. Features

### Customer
- Register, log in, log out
- Create a repair booking (device, brand, service category, date, time, problem)
- View booking history and booking details
- Update or cancel a booking (pending or in progress)
- Update profile (email is read-only)

### Technician
- Log in, log out
- Dashboard and job queue
- Accept or reject a job
- Update repair notes and mark a job complete
- Update profile and optional photo (email is read-only)

### System
- Role-based access (customer vs technician)
- Guests and the wrong role are redirected to `/login`
- Data stored in MongoDB (`users`, `technicians`, `bookings`, `jobs`)
- Client and server form validation
- Seeded demo accounts on first empty database

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Server | Express 5 |
| Views | EJS (`view/` folder) |
| UI | Bootstrap 5, Bootstrap Icons (served from `public/`) |
| Database | MongoDB (native driver) |
| Uploads | Multer (technician photos) |
| Config | `dotenv` (`.env` is not committed) |

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
- `route/index.js` maps URLs to controllers. Customer routes use `requireCustomer`. Technician routes use `requireTechnician`.
- Auth uses HttpOnly cookies: `authEmail` and `authRole`.
- Creating a booking inserts a **booking** (`status: pending`) and a **job** (`status: new`).
- Technician accept / complete updates the related job (and booking status where implemented).
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
| GET/POST | `/profile` | customer | Customer profile |
| GET | `/technician/dashboard` | technician | Dashboard |
| GET | `/technician/bookings` | technician | Job list |
| POST | `/technician/bookings/:id/accept` | technician | Accept job |
| POST | `/technician/bookings/:id/reject` | technician | Reject job |
| GET/POST | `/technician/bookings/:id` | technician | View / update job |
| GET/POST | `/technician/profile` | technician | Technician profile |

End-to-end workflow: customer books repair → technician accepts → technician completes → customer sees **Completed**.

---

## 4. Local setup

### Prerequisites
- Node.js 18 or later
- A MongoDB Atlas cluster (or local MongoDB) and a connection string

### Steps

```bash
git clone https://github.com/Bhumin-qut/repair-service-booking.git
cd repair-service-booking
npm install
```

Create a `.env` file in the project root (same folder as `package.json`). Do **not** commit this file.

```
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=repair_service_booking
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
├── index.js                 # App bootstrap and MongoDB connect
├── package.json
├── .env                     # Local secrets (gitignored)
├── db/
│   └── config.js            # Connection, cookies, hash, seed
├── middelware/
│   └── middelware.js        # requireCustomer / requireTechnician
├── helper/
│   └── helperLib.js         # Dates, validators, view helpers
├── route/
│   ├── index.js             # Router
│   ├── user.controller.js
│   ├── booking.controller.js
│   └── technician.controller.js
├── view/                    # EJS templates
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
2. Security group: allow **22** only from your IP; allow **80** (and **443** if you use HTTPS). Open **3000** only if you run the app on that port without a reverse proxy.
3. SSH in. Install Node.js 18+.
4. Clone this repository. Run `npm install --omit=dev`.
5. Create `.env` on the server with `MONGODB_URI` and `MONGODB_DB`. Never commit `.env`.
6. Start the process so it stays up during marking, for example:

```bash
sudo npm install -g pm2
pm2 start index.js --name repair-booking
pm2 save
pm2 startup
```

7. Optional: put Nginx in front and proxy to `http://127.0.0.1:3000`.
8. Confirm the public URL in a browser using the demo accounts.

**Instance ID / name:** _Fill from the AWS console._  
**Public URL:** _Fill here and on the assessment cover page._

---

## 7. Known limitations

- No payment or invoicing
- Forgot-password screen does not send real email
- No admin role
- No automated test suite
- Auth is cookie-based for this sample; not a full session/passport stack
- Folder name `middelware` is spelled as in the repo
- Seeded jobs are sample data; new customer bookings create matching jobs
- Photo uploads are stored on disk under `public/uploads/technicians/` (not in MongoDB)
- GitHub Actions workflow in this repo is not required for marking

---

## 8. Assessment notes

- Use feature branches named after Jira issues (for example `SCRUM-12-create-booking`).
- Open a pull request and add a self-review comment before merge.
- Tag the submitted release (for example `v1.0-assessment1`).
- Keep Jira, Figma, design diagrams, commits, and this README consistent when a change request is made.
