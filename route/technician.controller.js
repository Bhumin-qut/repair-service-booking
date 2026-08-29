const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { getCollection, hashPassword } = require('../db/config');
const { timeAgo } = require('../helper/helperLib');

const specializations = [
  'Laptop & PC Repair',
  'Smartphone Repair',
  'Tablet Repair',
  'Hardware Diagnostic',
  'Data Recovery',
  'Other'
];

const jobStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const photoDir = path.join(__dirname, '../public/uploads/technicians');
fs.mkdirSync(photoDir, { recursive: true });

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, photoDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      cb(null, `tech-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  }
});

//technician
exports.uploadPhoto = (req, res, next) => {
  photoUpload.single('photo')(req, res, (error) => {
    if (!error) return next();
    console.error('Photo upload failed:', error);
    return res.status(400).send(error.message || 'Unable to upload photo.');
  });
};

//technician
function deletePhotoFile(photoUrl) {
  if (!photoUrl || !photoUrl.startsWith('/uploads/technicians/')) return;
  const filePath = path.join(__dirname, '../public', photoUrl);
  fs.unlink(filePath, () => {});
}

//technician
function toTechnicianView(technician) {
  return {
    role: 'technician',
    fullName: technician.fullName,
    email: technician.email,
    phone: technician.phone,
    specialization: technician.specialization,
    experience: technician.experience,
    availability: technician.availability,
    address: technician.address,
    photoUrl: technician.photoUrl || ''
  };
}

//technician
function toAssignedJob(job) {
  return {
    id: job.id,
    status: job.status,
    timeAgo: job.status === 'new' ? timeAgo(job.createdAt) : '',
    customer: typeof job.customer === 'string' ? job.customer : (job.customer && job.customer.name) || '',
    device: job.device || `${job.deviceBrand || ''} ${job.deviceName || ''}`.trim(),
    issue: job.issue || job.reportedProblem || '',
    location: job.location
  };
}

// technician
function toJobView(job) {
  const customer = typeof job.customer === 'string'
    ? { name: job.customer, email: job.customerEmail || '', phone: job.phone || '' }
    : (job.customer || { name: '', email: '', phone: '' });

  return {
    id: job.id,
    status: job.status,
    deviceName: job.deviceName || job.device || '',
    deviceBrand: job.deviceBrand || '',
    serialNumber: job.serialNumber || 'Pending',
    notes: job.notes || '',
    customer,
    reportedProblem: job.reportedProblem || job.issue || ''
  };
}

// technician
function technicianLocals(technician, extra) {
  return Object.assign({ user: toTechnicianView(technician) }, extra);
}

//technician
function jobsListPath(req) {
  const referer = req.get('Referer') || '';
  return referer.includes('/technician/dashboard') ? '/technician/dashboard' : '/technician/bookings';
}

//technician
async function loadTechnicianJobs() {
  return getCollection('jobs')
    .find({ status: { $ne: 'rejected' } })
    .sort({ createdAt: -1 })
    .toArray();
}

//technician
function toJobLists(jobs) {
  const assignedJobs = jobs
    .filter((job) => ['new', 'in-progress', 'completed'].includes(job.status))
    .map(toAssignedJob);

  const todaySchedule = jobs
    .filter((job) => job.schedule)
    .map((job) => job.schedule);

  return { assignedJobs, todaySchedule };
}

//technician
exports.getProfile = async (req, res) => {
  try {
    const technician = req.user;

    return res.render('update-technician-profile', technicianLocals(technician, {
      title: 'Update Technician Profile',
      currentPage: 'profile',
      specializations
    }));
  } catch (error) {
    console.error('Load technician profile failed:', error);
    return res.status(500).send('Unable to load profile.');
  }
};

//technician
exports.updateProfile = async (req, res) => {
  try {
    const technician = req.user;

    const {
      fullName,
      phone,
      specialization,
      experience,
      availability,
      address,
      newPassword,
      confirmPassword
    } = req.body;

    const update = {
      fullName: fullName || technician.fullName,
      phone: phone || technician.phone,
      specialization: specialization || technician.specialization,
      experience: experience ? Number(experience) : technician.experience,
      availability: availability || technician.availability,
      address: address || technician.address,
      updatedAt: new Date()
    };

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        return res.status(400).send('Passwords do not match.');
      }
      update.passwordHash = hashPassword(newPassword);
    }

    if (req.file) {
      update.photoUrl = `/uploads/technicians/${req.file.filename}`;
      deletePhotoFile(technician.photoUrl);
    } else if (req.body.removePhoto === '1') {
      update.photoUrl = '';
      deletePhotoFile(technician.photoUrl);
    }

    await getCollection('technicians').updateOne({ _id: technician._id }, { $set: update });
    return res.redirect('/technician/profile');
  } catch (error) {
    console.error('Update technician profile failed:', error);
    return res.status(500).send('Unable to update profile.');
  }
};

//technician
exports.getBookings = async (req, res) => {
  try {
    const technician = req.user;

    const jobs = await loadTechnicianJobs();
    const { assignedJobs, todaySchedule } = toJobLists(jobs);

    return res.render('technician-bookings', technicianLocals(technician, {
      title: 'Technician Bookings',
      currentPage: 'bookings',
      todaySchedule,
      assignedJobs,
      newCount: assignedJobs.filter((job) => job.status === 'new').length
    }));
  } catch (error) {
    console.error('Load technician bookings failed:', error);
    return res.status(500).send('Unable to load bookings.');
  }
};

//technician
exports.acceptJob = async (req, res) => {
  try {
    const jobs = getCollection('jobs');
    const job = await jobs.findOne({ id: req.params.id, status: 'new' });

    if (job) {
      const newId = `JOB-${Math.floor(8000 + Math.random() * 900)}`;
      await jobs.updateOne(
        { id: job.id },
        {
          $set: {
            id: newId,
            status: 'in-progress',
            deviceName: job.deviceName || job.device,
            deviceBrand: job.deviceBrand || '',
            serialNumber: job.serialNumber || 'Pending',
            notes: job.notes || '',
            reportedProblem: job.reportedProblem || job.issue,
            updatedAt: new Date()
          },
          $unset: { timeAgo: '' }
        }
      );

      if (job.bookingId) {
        await getCollection('bookings').updateOne(
          { id: job.bookingId },
          { $set: { status: 'in-progress', updatedAt: new Date() } }
        );
      }
    }

    return res.redirect(jobsListPath(req));
  } catch (error) {
    console.error('Accept job failed:', error);
    return res.status(500).send('Unable to accept job.');
  }
};

//technician
exports.rejectJob = async (req, res) => {
  try {
    const jobs = getCollection('jobs');
    const job = await jobs.findOne({ id: req.params.id, status: 'new' });

    if (job) {
      await jobs.updateOne(
        { id: job.id },
        { $set: { status: 'rejected', updatedAt: new Date() } }
      );

      if (job.bookingId) {
        await getCollection('bookings').updateOne(
          { id: job.bookingId },
          { $set: { status: 'cancelled', updatedAt: new Date() } }
        );
      }
    }

    return res.redirect(jobsListPath(req));
  } catch (error) {
    console.error('Reject job failed:', error);
    return res.status(500).send('Unable to reject job.');
  }
};

//technician
exports.getJob = async (req, res) => {
  try {
    const technician = req.user;

    const job = await getCollection('jobs').findOne({ id: req.params.id });
    if (!job) {
      return res.status(404).send('Job not found');
    }

    return res.render('update-repair-details', technicianLocals(technician, {
      title: `Job #${job.id}`,
      currentPage: 'bookings',
      job: toJobView(job),
      jobStatuses
    }));
  } catch (error) {
    console.error('Load job failed:', error);
    return res.status(500).send('Unable to load job.');
  }
};

//technician
exports.updateJob = async (req, res) => {
  try {
    const jobs = getCollection('jobs');
    const job = await jobs.findOne({ id: req.params.id });
    if (!job) {
      return res.status(404).send('Job not found');
    }

    const status = req.body.action === 'complete' ? 'completed' : req.body.status;
    await jobs.updateOne(
      { id: job.id },
      {
        $set: {
          notes: req.body.notes || '',
          status,
          updatedAt: new Date()
        }
      }
    );

    if (job.bookingId) {
      await getCollection('bookings').updateOne(
        { id: job.bookingId },
        { $set: { status, updatedAt: new Date() } }
      );
    }

    return res.redirect(`/technician/bookings/${job.id}`);
  } catch (error) {
    console.error('Update job failed:', error);
    return res.status(500).send('Unable to update job.');
  }
};

//technician
exports.getDashboard = async (req, res) => {
  try {
    const technician = req.user;

    const jobs = await loadTechnicianJobs();
    const { assignedJobs, todaySchedule } = toJobLists(jobs);
    const newJobs = assignedJobs.filter((job) => job.status === 'new');
    const inProgressJobs = assignedJobs.filter((job) => job.status === 'in-progress');
    const completedJobs = assignedJobs.filter((job) => job.status === 'completed');

    return res.render('technician-dashboard', technicianLocals(technician, {
      title: 'Technician Dashboard',
      currentPage: 'dashboard',
      stats: {
        newCount: newJobs.length,
        inProgressCount: inProgressJobs.length,
        completedCount: completedJobs.length,
        scheduleCount: todaySchedule.length
      },
      todaySchedule,
      newJobs,
      activeJobs: inProgressJobs.slice(0, 4)
    }));
  } catch (error) {
    console.error('Load technician dashboard failed:', error);
    return res.status(500).send('Unable to load dashboard.');
  }
};
