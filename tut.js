let slideIndex = 0;
let slides = document.getElementsByClassName("slide");
let autoScroll = true;
let timer;


function showSlide(index) {
  if (index >= slides.length) slideIndex = 0;
  if (index < 0) slideIndex = slides.length - 1;

  for (let slide of slides) {
    slide.style.display = "none";
    slide.style.left = "200px"; // default left position for others
  }

  slides[slideIndex].style.display = "block";

  // Check if the current slide contains the specific image
  const img = slides[slideIndex].querySelector("img");
  if (img && img.id === "tooBig") {
    slides[slideIndex].style.left = "150px"; // adjust only this one
        slides[slideIndex].style.top = "100px"; // adjust only this one


  }
}

function nextSlide() {
  slideIndex++;
  showSlide(slideIndex);
}

function prevSlide() {
  slideIndex--;
  showSlide(slideIndex);
}

function startAutoScroll() {
  timer = setInterval(() => {
    slideIndex++;
    showSlide(slideIndex);
  }, 3000);
}

function stopAutoScroll() {
  clearInterval(timer);
}

document.querySelector(".next").addEventListener("click", () => {
  nextSlide();
  if (autoScroll) {
    stopAutoScroll();
    startAutoScroll();
  }
});

document.querySelector(".prev").addEventListener("click", () => {
  prevSlide();
  if (autoScroll) {
    stopAutoScroll();
    startAutoScroll();
  }
});

document.getElementById("toggleAuto").addEventListener("click", () => {
  autoScroll = !autoScroll;
  if (autoScroll) {
    startAutoScroll();
    document.getElementById("toggleAuto").textContent = "Stop Auto Scroll";
  } else {
    stopAutoScroll();
    document.getElementById("toggleAuto").textContent = "Start Auto Scroll";
  }
});

showSlide(slideIndex);
startAutoScroll();