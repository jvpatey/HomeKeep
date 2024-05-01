/* ----- Firebase Initialization ----- */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrQCy3XJHfkusqmoXafsCqjAcZJWInx7s",
  authDomain: "homekeep-x.firebaseapp.com",
  projectId: "homekeep-x",
  storageBucket: "homekeep-x",
  messagingSenderId: "142689184811",
  appId: "1:142689184811:web:61e53ac8ec053c68bc0e6e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Check if user is signed in
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is logged in:", user);
    } else {
        console.log("No user logged in.");
    }
});

/* ----- Firebase Authorization ----- */

// Sign in with google firebase auth
function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
    .then(result => {
        const user = result.user;
        console.log("Signed in user:", user);
        window.location.href = "dashboard.html";
    })
    .catch(error => {
        console.error("Google sign-in error:", error);
    });
}

// Add event listeners once DOM is loadeed
document.addEventListener("DOMContentLoaded", function() {

    // event listener for google sign in btn
    document.getElementById("loginGoogleBtn").addEventListener("click", signInWithGoogle);

    // event listener for email/pass login
    document.getElementById("loginEmailPassword").addEventListener("click", function(event) {
        event.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        signInWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                const user = userCredential.user;
                console.log("Signed in user:", user);
                window.location.href = "dashboard.html";
            })
                .catch(error => {
                console.error("Error:", error);
                alert("Incorrect email or password. Please try again.");
            });
    });

    // event listener for forgot password link
    document.getElementById("forgotPasswordLink").addEventListener("click", function(event) {
        event.preventDefault();
        const email = prompt("Please enter your email address to reset your password:");
        if (email) {
            sendPasswordResetEmail(auth, email)
            .then(() => {
                alert("Password reset email sent. Please check your email inbox.");
            })
            .catch(error => {
                console.error("Error sending password reset email:", error);
                alert("Error sending password reset email. Please try again later.");
            });
        }
    });

    // event listener for create account form
    document.getElementById("createAccountLink").addEventListener("click", showCreateAccountModal);

    // event listener for help form icon
    document.getElementById("chatIcon").addEventListener("click", toggleChatModal);

    // loadModals function call
    loadModals();
});

/* ----- Modals ----- */

// function to fetch and load modals
function loadModals() {
  fetch('modals.html')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(html => {
      document.body.insertAdjacentHTML('beforeend', html);

        // Event listener for create account form submission
        const signupForm = document.getElementById('signupForm');
        signupForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const firstName = document.getElementById("firstName").value;
            const lastName = document.getElementById("lastName").value;
            const email = document.getElementById("signupEmail").value;
            const password = document.getElementById("signupPassword").value;

            // create new user with firestore auth
            createUserWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                const user = userCredential.user;
                console.log("User created:", user);
                const createAccountModal = document.getElementById('createAccountModal');
                createAccountModal.close();
            })
            .catch(error => {
                console.error("Error creating user:", error);
                alert(error.message);
            });
        });
    })
    .catch(error => {
        console.error('Error fetching modal content:', error);
    });
};

// function to show create account modal
function showCreateAccountModal() {
  var createAccountModal = document.getElementById('createAccountModal');
  if (createAccountModal) {
    createAccountModal.showModal();
  }
}

// function to toggle help for when clicking chat icon
function toggleChatModal() {
  var chatModal = document.getElementById("chatModal");
  chatModal.style.display = chatModal.style.display === "block" ? "none" : "block";
}

/* ----- Dark Mode functionality ----- */

// function to toggle dark mode with icon
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
}

// event listener for dark mode icon
document.getElementById("darkModeToggle").addEventListener("click", toggleDarkMode);

// changing icon based on current mode
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
