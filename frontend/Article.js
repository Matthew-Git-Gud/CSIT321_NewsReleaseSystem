// Get article content
const articleContent =
    document.getElementById("articleContent");


// Get dark mode checkbox
const darkModeToggle =
    document.getElementById("darkModeToggle");



/* CHANGE ARTICLE TEXT SIZE */
const originalFontSizes = new Map();

document.addEventListener("DOMContentLoaded", function(){

    const elements = document.querySelectorAll("body *");

    elements.forEach(function (element) {

        const fontSize = 
        parseFloat(
            window.getComputedStyle(element).fontSize
        );

        if (!isNaN(fontSize)) {

            originalFontSizes.set(
                element,
                fontSize
            );
        }
    });
});


function updateFontButton(size) {

    const buttons = 
        document.querySelectorAll(
            "[data-font-size]"
        );

    buttons.forEach(function (button) {
        button.classList.remove(
            "font-selected"
        );
    });

    const selectedButtons = 
        document.querySelectorAll(
            '[data-font-size="' + size + '"]'
        );

    selectedButtons.forEach(
        function(button) {

            button.classList.add(
                "font-selected"
            );
        }
    );  
}



function setTextSize(size) {

    if (size === "small") {

        document.documentElement.style.fontSize =
            "14px";

    }

    else if (size === "medium") {

        document.documentElement.style.fontSize =
            "16px";

    }

    else if (size === "large") {

        document.documentElement.style.fontSize =
            "20px";

    }

}



function setArticleTextSize(size) {

    if (size === "small") {

        articleContent.style.fontSize =
            "14px";

    }

    else if (size === "medium") {

        articleContent.style.fontSize =
            "16px";

    }

    else if (size === "large") {

        articleContent.style.fontSize =
            "20px";

    }

}



/* DARK MODE */
function setDarkMode() {

    document.body.classList.add(
        "dark-mode"
    );

    darkModeToggle.checked =
        true;

}



/* LIGHT MODE */
function setLightMode() {

    document.body.classList.remove(
        "dark-mode"
    );

    darkModeToggle.checked =
        false;

}



/* NAVBAR DARK MODE SWITCH */
darkModeToggle.addEventListener(
    "change",
    function () {

        document.body.classList.toggle(
            "dark-mode",
            this.checked
        );

    }
);


/* AUTH MODALS (SIGN IN and SIGN UP) */

const authOverlay = document.getElementById("authOverlay");
const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");
const loginError = document.getElementById("loginError");
const registerError = document.getElementById("registerError");

let selectedTopics = [];


// Opens the overlay and shows either the login or register panel.

function openAuthModal(type) {

    authOverlay.classList.add("open");

    if (type === "register") {

        loginModal.classList.remove("active");
        registerModal.classList.add("active");

    }

    else {

        registerModal.classList.remove("active");
        loginModal.classList.add("active");

    }

    loginError.classList.remove("show");
    registerError.classList.remove("show");

}


function closeAuthModal() {

    authOverlay.classList.remove("open");

}


// Clicking the dark overlay outside either card closes the modal.

authOverlay.addEventListener("click", function (event) {

    if (event.target === authOverlay) {

        closeAuthModal();

    }

});


// "No account? Create one" link inside the login modal.

function switchToSignUp(event) {

    event.preventDefault();

    openAuthModal("register");

}


// "Already have an account? Sign in"

function switchToSignIn(event) {

    event.preventDefault();

    openAuthModal("login");

}



function handleLogin(event) {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    if (!email || !password) {

        loginError.classList.add("show");

        return false;

    }

    loginError.classList.remove("show");

    alert("Signed in! (demo only — no account system connected)");

    closeAuthModal();

    return false;

}


// Toggles a preferred-topic pill on/off, capped at 5 selections.
function toggleTopic(pill, topic) {

    if (pill.classList.contains("selected")) {

        pill.classList.remove("selected");

        selectedTopics =
            selectedTopics.filter(function (t) {
                return t !== topic;
            });

        return;

    }

    if (selectedTopics.length >= 5) {

        alert("You can select up to 5 topics.");

        return;

    }

    pill.classList.add("selected");

    selectedTopics.push(topic);

}


function handleRegister(event) {

    event.preventDefault();

    const firstName =
        document.getElementById("firstName").value.trim();

    const lastName =
        document.getElementById("lastName").value.trim();

    const username =
        document.getElementById("username").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const formIsComplete =
        firstName && lastName && username &&
        email && password && confirmPassword;

    if (!formIsComplete || password !== confirmPassword) {

        registerError.classList.add("show");

        return false;

    }

    registerError.classList.remove("show");

    alert("Account created! (demo only — no account system connected)");

    closeAuthModal();

    return false;

}
