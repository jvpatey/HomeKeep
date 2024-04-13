/* ----- Firebase Initialization ----- */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

// Firbase config
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
const firestore = getFirestore(app);
const messagesCollection = collection(firestore, 'messages');
const responsesCollection = collection(firestore, 'responses'); // New collection reference

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

/* ----- Firebase messages via chat ----- */

// Function to send a message to Firestore
async function sendMessage(message) {
    try {
        await addDoc(messagesCollection, {
            sender: 'user', // You can replace 'user' with any identifier for the sender
            content: message,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

// Function to handle receiving messages from Firestore
function receiveMessage(snapshot) {
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const message = change.doc.data();
            const messagesContainer = document.getElementById('messagesContainer');
            const messageElement = document.createElement('div');
            messageElement.textContent = message.sender + ': ' + message.content;
            messagesContainer.appendChild(messageElement);
        }
    });
}

// Listen for new messages from Firestore
onSnapshot(messagesCollection, receiveMessage);

// Function to handle receiving response messages from Firestore
function receiveResponse(snapshot) {
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const response = change.doc.data();
            const messagesContainer = document.getElementById('messagesContainer');
            const responseElement = document.createElement('div');
            responseElement.textContent = response.sender + ': ' + response.content;
            messagesContainer.appendChild(responseElement);
        }
    });
}

// Listen for new response messages from Firestore
onSnapshot(responsesCollection, receiveResponse);

// Function to handle form submission
function handleSubmit(event) {
    event.preventDefault();
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    if (message !== '') {
        sendMessage(message); // Call sendMessage function
        messageInput.value = '';
    }
}

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
    var signupForm = document.getElementById('signupForm');
    var chatForm = document.getElementById('chatForm'); // Get the chatForm

    if (createAccountModal && signupForm && chatForm) {
        document.getElementById('createAccountLink').addEventListener('click', function() {
            createAccountModal.showModal();
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

        // Event listener for chat form submission
        chatForm.addEventListener('submit', handleSubmit);
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

function toggleChatModal() {
    var chatModal = document.getElementById("chatModal");
    if (chatModal.style.display === "block") {
        chatModal.style.display = "none"; // Close the modal
    } else {
        chatModal.style.display = "block"; // Open the modal
    }
}

// Add event listeners to show modals
document.getElementById('createAccountLink').addEventListener('click', showCreateAccountModal);
document.getElementById("chatIcon").addEventListener("click", toggleChatModal)

//call load modals function
document.addEventListener('DOMContentLoaded', function() {
    loadModals();
});
