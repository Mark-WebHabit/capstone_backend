export function getTime() {
  // Create a new Date object
  const currentDate = new Date();

  // Get the current time components
  let hours = currentDate.getHours();
  let minutes = currentDate.getMinutes();
  let seconds = currentDate.getSeconds();

  if (hours < 10) {
    hours = `0${hours}`;
  }
  if (minutes < 10) {
    minutes = `0${minutes}`;
  }
  if (seconds < 10) {
    seconds = `0${seconds}`;
  }

  // Format the time as HH:MM:SS
  const currentTime = `${hours}:${minutes}:${seconds}`;

  return currentTime;
}
