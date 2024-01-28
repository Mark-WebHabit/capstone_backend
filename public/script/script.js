const body = document.querySelector("body");
const circle = document.querySelector(".circle");
const logo = body.querySelector(".logo");
const logoImg = logo.querySelector("img");

function updateCircle() {
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  const perimeter = windowHeight + windowWidth;

  logo.style.width = perimeter / 5 + "px";
  logo.style.height = perimeter / 5 + "px";
  logo.style.borderRadius = perimeter / 5 / 2 + "px";
  logoImg.style.width = logo.clientHeight - 100 + "px";
  // logoImg.style.height = `calc(${logo.clientHeight} - 2em)`

  circle.style.height = perimeter + "px";
  circle.style.width = perimeter + "px";
  circle.style.borderTopLeftRadius = perimeter / 2 + "px";
  circle.style.left = windowWidth / 2.5 + "px";

  if (windowWidth < 970) {
    circle.style.left = windowWidth / 10 + "px";
    circle.style.top = windowHeight / 3 + "px";
  }
  if (windowWidth < 500) {
    circle.style.display = "none";
    logo.style.display = "none";
  }
}

// Initialize the circle on page load
window.addEventListener("DOMContentLoaded", updateCircle);

// Update the circle when the screen size changes
window.addEventListener("resize", updateCircle);
