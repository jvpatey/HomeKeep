/* ------ Firebase Initialization ------- */

// Import Firebase, Firestore, Auth
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js'
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

/* ----- Check to see if user is logged in ----- */

// Check if user is signed in and redirect if not
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is logged in:", user);
  } else {
    console.log("No user logged in.");
    // Redirect to login page or index.html if no user is logged in
    window.location.href = "index.html";
    console.log("redirected to index.html - no user logged in.")
    alert("Please log in to access this page.")
  }
});

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

/* -----  Help request pop up ----- */

// function to toggle open/close of modal when icon is clicked
function toggleChatModal() {
  var chatModal = document.getElementById("chatModal");
  if (chatModal.style.display === "block") {
      chatModal.style.display = "none";
  } else {
      chatModal.style.display = "block";
  }
};

// Close the chat modal if clicked outside the window
document.addEventListener('click', function(event) {
  const chatModal = document.getElementById("chatModal");
  const isClickInside = chatModal.contains(event.target);

  if (!isClickInside && chatModal.style.display === "block") {
      chatModal.style.display = "none";
  }
});

// Ensure the chat modal toggle doesn't close when clicking inside
document.getElementById("chatIcon").addEventListener("click", function(event) {
  event.stopPropagation();
  toggleChatModal();
});

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

document.addEventListener('DOMContentLoaded', function() {
  const dropdownButton = document.querySelector('.dropdown .btn-ghost');
  const dropdownContent = document.querySelector('.dropdown-content');
  
  dropdownButton.addEventListener('click', function(event) {
    event.stopPropagation();
    
    // Check if the dropdown is open
    const isOpen = dropdownContent.style.display === 'block'; 
    
    // Toggle display
    if (isOpen) {
      dropdownContent.style.display = 'none';
    } else {
      dropdownContent.style.display = 'block';
    }
  });

  // Close the dropdown if clicked outside
  document.addEventListener('click', function() {
    dropdownContent.style.display = 'none';
  });
});

/* ---- Firbase Auth Sign Out JS ----- */

// Function to sign out the user
function signOutUser() {
  signOut(auth)
      .then(() => {
          window.location.href = "index.html";
      })
      .catch((error) => {
          console.error("Error signing out: ", error);
      });
};

// Add event listener to the sign out link
document.getElementById('signOutLink').addEventListener('click', function(event) {
  event.preventDefault();
  signOutUser();
});