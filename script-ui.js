/* ----- Dark Mode functionality ----- */

// Toggle dark mode and save the preference to local storage
function toggleDarkMode() {
  const body = document.querySelector("body");
  const icon = document.getElementById("darkModeToggle").querySelector("i");

  if (body.classList.contains("dark")) {
    body.classList.remove("dark");
    localStorage.setItem("darkMode", "false");
    icon.className = "fa-solid fa-moon text-charcoal hover:text-marine";
  } else {
    body.classList.add("dark");
    localStorage.setItem("darkMode", "true");
    icon.className = "fa-solid fa-sun text-feather hover:text-marine";
  }
};
  
// Event listener for the dark mode toggle button
document.getElementById("darkModeToggle").addEventListener("click", toggleDarkMode);
  
// Apply the correct dark mode setting on page load
window.addEventListener("load", function() {
  const darkMode = localStorage.getItem("darkMode");
  const body = document.querySelector("body");
  const icon = document.getElementById("darkModeToggle").querySelector("i");

  if (darkMode === "true") {
    body.classList.add("dark");
    icon.className = "fa-solid fa-sun text-feather hover:text-marine";
  } else {
    body.classList.remove("dark");
    icon.className = "fa-solid fa-moon text-charcoal hover:text-marine";
  }
});

/* ----- Help form ----- */

// function to handle toggling the help form
function toggleChatModal() {
    var chatModal = document.getElementById("chatModal");
    if (chatModal.style.display === "block") {
        chatModal.style.display = "none";
    } else {
        chatModal.style.display = "block";
    }
};

// event listener for chat icon
document.getElementById("chatIcon").addEventListener("click", toggleChatModal);

/* ----- Modals ----- */

// Function to load modal content from modals.html
function loadModals() {
    fetch('modals.html')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(html => {
        console.log('Modal content fetched successfully:');
        document.body.insertAdjacentHTML('beforeend', html);
    })
    .catch(error => {
        console.error('Error fetching modal content:', error);
    });
};

// call load modals function
document.addEventListener('DOMContentLoaded', function() {
    loadModals();
});