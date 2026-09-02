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

function trim(value) {
  return String(value || '').trim();
}
module.exports = {
  formatDate,
  formatTime,
  timeAgo,
  trim
};
