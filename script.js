document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.slider').forEach(initializeSlider);
});

window.addEventListener('resize', () => {
  document.querySelectorAll('.slider').forEach(updateSliderOnResize);
});

function initializeSlider(slider) {
  let track = slider.querySelector('.slide-track');
  let leftArrow = slider.querySelector('.arrow.left');
  let rightArrow = slider.querySelector('.arrow.right');
  let isDragging = false;
  let hasDragged = false;
  let startX, startY;
  let currentTransform = getCurrentTransform(track);

  updateSliderOnResize(slider); // Set up the slider dimensions immediately on load

  // Arrow clicks
  leftArrow.addEventListener('click', () => moveSlider(slider, 'left'));
  rightArrow.addEventListener('click', () => moveSlider(slider, 'right'));

  // Drag events
  setupDragEvents(slider);
}

function updateSliderOnResize(slider) {
  let track = slider.querySelector('.slide-track');
  let maxTransform = -(track.scrollWidth - slider.offsetWidth);

  updateArrows(slider, maxTransform);
  resetTransform(slider, track);
}

function resetTransform(slider, track) {
  // Reset the transform to ensure it's within the new bounds
  track.style.transition = 'none';
  track.style.transform = 'translateX(0px)';
}

function updateArrows(slider, maxTransform) {
  let leftArrow = slider.querySelector('.arrow.left');
  let rightArrow = slider.querySelector('.arrow.right');
  let currentTransform = getCurrentTransform(slider.querySelector('.slide-track'));

  leftArrow.style.display = currentTransform < 0 ? 'block' : 'none';
  rightArrow.style.display = currentTransform > maxTransform ? 'block' : 'none';

  // Hide arrows on smaller screens
  const breakpoint = 768;
  if (window.innerWidth <= breakpoint) {
    leftArrow.style.display = 'none';
    rightArrow.style.display = 'none';
  }
}

function getCurrentTransform(track) {
  let style = window.getComputedStyle(track);
  let matrix = new WebKitCSSMatrix(style.transform);
  return matrix.m41; // This is the horizontal translate value from the matrix
}

function moveSlider(slider, direction) {
  const track = slider.querySelector('.slide-track');
  const slideWidth = slider.querySelector('.tile').offsetWidth * 2;
  const maxTransform = -(track.scrollWidth - slider.offsetWidth);

  let deltaX;
  if (direction === 'left') {
    deltaX = slideWidth;
  } else {
    deltaX = -slideWidth;
  }

  let newTransform = getCurrentTransform(track) + deltaX;

  // Ensure that the new transform doesn't exceed the boundaries
  newTransform = Math.max(Math.min(newTransform, 0), maxTransform);

  track.style.transition = 'transform 0.3s ease-out';
  track.style.transform = `translateX(${newTransform}px)`;

  setTimeout(() => updateArrows(slider, maxTransform), 300);
}
function setupDragEvents(slider) {
  let track = slider.querySelector('.slide-track');
  let isDragging = false;
  let startX, startY, deltaX = 0;
  let currentTransform = getCurrentTransform(track);
  let initialScrollTop = 0; // To store the initial scroll position

  const startDrag = (e) => {
    isDragging = true;
    startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    initialScrollTop = window.pageYOffset || document.documentElement.scrollTop; // Get initial scroll position
    deltaX = 0;
    track.style.transition = 'none';
    currentTransform = getCurrentTransform(track);
    if (e.type === 'mousedown') {
      window.addEventListener('mousemove', onDrag, false);
      window.addEventListener('mouseup', endDrag, false);
    } else {
      window.addEventListener('touchmove', onDrag, { passive: false });
      window.addEventListener('touchend', endDrag, false);
    }
  };

  const onDrag = (e) => {
    if (!isDragging) return;

    let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    deltaX = clientX - startX;
    let deltaY = clientY - startY;

    let angle = Math.atan2(Math.abs(deltaY), Math.abs(deltaX)) * 180 / Math.PI;

    // Increase the angle threshold to make horizontal swiping more dominant
    if (angle < 30) {
      if (e.cancelable) {
        e.preventDefault(); // Prevent scrolling in all directions
      }
      window.scrollTo(0, initialScrollTop); // Lock vertical scroll
      track.style.transform = `translateX(${currentTransform + deltaX}px)`;
      hasDragged = true;
    } else {
      isDragging = false;
      snapToGrid(slider);
      setTimeout(() => {
        hasDragged = false;
      }, 100);
    }
  };

  const endDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    if (e.type === 'mouseup') {
      window.removeEventListener('mousemove', onDrag, false);
    }
    if (hasDragged) {
    snapToGrid(slider, deltaX);
      if (e.cancelable) {
        e.preventDefault();
      }
      setTimeout(() => {
        hasDragged = false;
      }, 100);
    }
  };

  // Mouse and touch events
  
// Start the drag on the track
track.addEventListener('mousedown', startDrag);
track.addEventListener('touchstart', startDrag, { passive: false });

// End the drag on the window to catch all cases
window.addEventListener('mouseup', (e) => endDrag(e, deltaX));
window.addEventListener('touchend', (e) => endDrag(e, deltaX));

// Move the drag on the track
track.addEventListener('mousemove', onDrag);
track.addEventListener('touchmove', onDrag, { passive: false });

  // Prevent click event on drag for links
  slider.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      if (hasDragged && e.cancelable) {
        e.preventDefault();
        hasDragged = false;
      }
    }, false);
  });
}

function snapToGrid(slider, dragDistance) {
  let track = slider.querySelector('.slide-track');
  let currentTransform = getCurrentTransform(track);
  let slideWidth = slider.querySelector('.tile').offsetWidth; // Use one-tile width for snapping
  let maxTransform = -(track.scrollWidth - slider.offsetWidth);
  
  // Adjust slideIndex calculation to account for drag distance
  let slideIndex = Math.round((currentTransform + dragDistance) / slideWidth);

  // Calculate the new transform position based on the nearest tile
  let newTransform = slideIndex * slideWidth;

  // Ensure that the new transform doesn't exceed the boundaries
  newTransform = Math.max(Math.min(newTransform, 0), maxTransform);

  // Apply the new transform with transition
  track.style.transition = 'transform 0.3s ease-out';
  track.style.transform = `translateX(${newTransform}px)`;

  // Update arrows after the slide
  setTimeout(() => updateArrows(slider, maxTransform), 300);
}