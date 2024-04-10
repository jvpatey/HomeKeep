/* -----Firebase Initialization----- */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCrQCy3XJHfkusqmoXafsCqjAcZJWInx7s",
  authDomain: "homekeep-x.firebaseapp.com",
  projectId: "homekeep-x",
  storageBucket: "homekeep-x.appspot.com",
  messagingSenderId: "142689184811",
  appId: "1:142689184811:web:61e53ac8ec053c68bc0e6e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Check authentication status
console.log(auth.currentUser);

// Handle authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is logged in:", user);
    } else {
        console.log("No user logged in.");
    }
});

/* -----Firebase Auth----- */

// Sign in with google auth
function signInWithGoogle() {
  console.log(auth)
    var provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            var user = result.user;
            console.log("Signed in user:", user);
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            console.error("Google sign-in error:", error);
        });
}

// function to sign in with username and password with firebase
document.addEventListener("DOMContentLoaded", function() {
document.getElementById("loginEmailPassword").addEventListener("click", function(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("Signed in user:", user);
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("Incorrect email or password. Please try again.");
        });
    })
});

// Function to handle forgot password link click
document.getElementById('forgotPasswordLink').addEventListener('click', function(event) {
    event.preventDefault();
    
    // Prompt user to enter their email
    const email = prompt("Please enter your email address to reset your password:");
    
    if (email) {
        // Send password reset email
        sendPasswordResetEmail(auth, email)
            .then(() => {
                alert("Password reset email sent. Please check your email inbox.");
            })
            .catch((error) => {
                console.error("Error sending password reset email:", error);
                alert("Error sending password reset email. Please try again later.");
            });
    }
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("loginGoogleBtn").addEventListener("click", signInWithGoogle);
});

/* Javascript to handle fetching and displaying modals */

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
            initializeModals();
        })
        .catch(error => {
            console.error('Error fetching modal content:', error);
        });
}

// Function to initialize modals and sign up form in create account modal
function initializeModals() {
    var createAccountModal = document.getElementById('createAccountModal');
    var helpModal = document.getElementById('helpRequestModal');
    var signupForm = document.getElementById('signupForm');

    if (createAccountModal && helpModal && signupForm) {
        document.getElementById('createAccountLink').addEventListener('click', function() {
            createAccountModal.showModal();
        });

        document.getElementById('helpFooterLink').addEventListener('click', function(event) {
            event.preventDefault();
            helpModal.showModal();
        });

        document.getElementById('helpLink').addEventListener('click', function(event) {
            event.preventDefault();
            helpModal.showModal();
        });

        // Event listener for create account form submission
        signupForm.addEventListener("submit", function(event) {
            event.preventDefault();

            console.log("Form submitted");

            const firstName = document.getElementById("firstName").value;
            const lastName = document.getElementById("lastName").value;
            const email = document.getElementById("signupEmail").value;
            const password = document.getElementById("signupPassword").value;

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log("User created:", user);
                    createAccountModal.close();
                })
                .catch((error) => {
                    console.error("Error creating user:", error);
                    alert(error.message);
                });
        });
    } else {
        console.error("One or more modals or signup form not found in the loaded content.");
    }
};

// Function to show the create account modal
function showCreateAccountModal() {
    var createAccountModal = document.getElementById('createAccountModal');
    if (createAccountModal) {
        createAccountModal.showModal();
    }
}

// Function to show the help modal
function showHelpModal() {
    var helpModal = document.getElementById('helpRequestModal');
    if (helpModal) {
        helpModal.showModal();
    }
}
// Add event listeners to show modals
document.getElementById('createAccountLink').addEventListener('click', showCreateAccountModal);
document.getElementById('helpFooterLink').addEventListener('click', showHelpModal);
document.getElementById('helpLink').addEventListener('click', showHelpModal);

//call load modals function
document.addEventListener('DOMContentLoaded', function() {
    loadModals();
});
