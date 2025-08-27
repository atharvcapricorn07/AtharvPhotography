// -------------------- Smooth Scroll --------------------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// -------------------- Shuffle Helper --------------------
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// -------------------- Load Gallery with View More --------------------
// -------------------- Load Gallery with View More --------------------
async function loadGallery() {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;

  try {
    const response = await fetch("photos.json");
    const data = await response.json();

    let allImages = [];

    // Create image elements
    for (let category in data) {
      // ✅ Skip the awards folder
      if (category === "awards") continue;

      data[category].forEach(filename => {
        let img = document.createElement("img");
        img.src = `photos/${category}/${filename}`;
        img.dataset.category = category;
        img.style.display = "none"; // hide initially
        allImages.push(img);

        // Lightbox click
        img.addEventListener("click", () => {
          document.getElementById("lightbox").style.display = "flex";
          document.getElementById("lightbox-img").src = img.src;
        });
      });
    }

    // Shuffle all images for ALL category
    allImages = shuffleArray(allImages);

    // Append all images to gallery
    allImages.forEach(img => gallery.appendChild(img));

    // Show only the first N images initially
    const INITIAL_COUNT = 6;
    allImages.slice(0, INITIAL_COUNT).forEach(img => (img.style.display = "block"));

    const viewMoreBtn = document.getElementById("view-more-btn");
    if (allImages.length <= INITIAL_COUNT && viewMoreBtn) {
      viewMoreBtn.style.display = "none";
    }

    if (viewMoreBtn) {
      viewMoreBtn.addEventListener("click", () => {
        allImages.forEach(img => {
          if (img.style.display === "none") {
            img.style.display = "block";
            img.classList.add("fade-in");
          }
        });
        viewMoreBtn.style.display = "none";
      });
    }

  } catch (err) {
    console.error("Error loading gallery:", err);
  }
}

loadGallery();

// -------------------- Filters --------------------
const filterBtns = document.querySelectorAll(".filter-btn");

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const category = btn.dataset.category;
    document.querySelectorAll(".gallery-grid img").forEach(img => {
      if (category === "all" || img.dataset.category === category) {
        img.style.display = "block";
      } else {
        img.style.display = "none";
      }
    });

    // Show/hide "View More" button only for "All"
    const viewMoreBtn = document.getElementById("view-more-btn");
    if (viewMoreBtn) {
      if (category === "all") {
        const hiddenImages = Array.from(document.querySelectorAll(".gallery-grid img")).filter(i => i.style.display === "none");
        viewMoreBtn.style.display = hiddenImages.length > 0 ? "inline-block" : "none";
      } else {
        viewMoreBtn.style.display = "none";
      }
    }
  });
});

// -------------------- Lightbox --------------------
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const closeBtn = document.querySelector(".lightbox .close");

if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    lightbox.style.display = "none";
    lightboxImg.src = "";
  });
}

if (lightbox) {
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      lightbox.style.display = "none";
      lightboxImg.src = "";
    }
  });
}

// -------------------- Dynamic Homepage Slideshow (.png) --------------------
async function loadHomepageSlideshow() {
  const topTrack = document.querySelector('.top-row .slide-track');
  const bottomTrack = document.querySelector('.bottom-row .slide-track');

  if (!topTrack || !bottomTrack) return;

  try {
    const response = await fetch('photos.json');
    const data = await response.json();

    const allImages = [];
    for (let category in data) {
      data[category].forEach(filename => {
        // Force .png extension
        let nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
        allImages.push(`photos/${category}/${nameWithoutExt}.png`);
      });
    }

    const shuffledImages = shuffleArray(allImages);
    const mid = Math.ceil(shuffledImages.length / 2);
    const topImages = shuffledImages.slice(0, mid);
    const bottomImages = shuffledImages.slice(mid);

    topImages.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      topTrack.appendChild(img);
    });

    bottomImages.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      bottomTrack.appendChild(img);
    });

  } catch (err) {
    console.error('Error loading homepage slideshow:', err);
  }
}

loadHomepageSlideshow();
