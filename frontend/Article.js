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