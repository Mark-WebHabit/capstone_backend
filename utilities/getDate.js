export function getDate() {
  // Create a new Date object
  const currentDate = new Date();

  // Get the current date components
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // Months are zero-indexed, so add 1
  const day = currentDate.getDate();

  // Format the date as YYYY-MM-DD
  const formattedCurrentDate = `${year}-${month < 10 ? "0" : ""}${month}-${
    day < 10 ? "0" : ""
  }${day}`;

  return formattedCurrentDate;
}
