    setTimeout(() => {
    $(".loading-screen").fadeOut(100);
    $(".cesium-viewer-fullscreenContainer").attr("style", "display", "none");
    $(".cesium-performanceDisplay-defaultContainer").attr("translate", "no");
    }, 3000);
    document.getElementById("infobox-arrow").addEventListener("mousedown", function() {
        const sidebar = document.getElementById("info-container");
        const tab = document.getElementById("infobox-arrow");
        const sidebarWidth = sidebar.offsetWidth;
        if (sidebar.style.left === "0px") {
            sidebar.style.left = ``; // Nascondi il sidebar
            sidebar.style.transition = "all 0.3s ease-in-out"; // Aggiungi transizione per l'animazione
            tab.style.right = ""; // Linguetta si sposta con l'animazione
            tab.style.transform = ""; // Aggiungi transizione per l'animazione
            tab.style.backgroundColor = ""; // Cambia il colore di sfondo della linguetta
            tab.style.transition = "all 0.3s ease-in-out"; // Aggiungi transizione per l'animazione
        } else {
            sidebar.style.left = "0px";
            sidebar.style.transition = "left 0.3s ease-in-out"; // Aggiungi transizione per l'animazione
            tab.style.right = "-2px"; // Linguetta si sposta con l'animazione
            tab.style.transform = "rotateY(-180deg)"; // Aggiungi transizione per l'animazione
            tab.style.backgroundColor = "transparent"; // Cambia il colore di sfondo della linguetta
            tab.style.transition = "all 0.3s ease-in-out"; // Aggiungi transizione per l'animazione
        }
    });

    const int1 = setInterval(() => {
        let loadingText = document.querySelector('.loading-text h1');
        const loadingscreen = document.querySelector('.loading-screen');
        loadingText.innerHTML += '.';
        if (loadingText.innerHTML.length > 10) {
            loadingText.innerHTML = 'Loading';
        }
        if (loadingscreen.style.display === 'none') {
            loadingText.innerHTML = 'Loading';
            clearInterval(int1);
        }
    }, 250);

    document.getElementsByClassName("copy-button")[0].addEventListener("click", function () {
        // Select the content to copy
        const copyButton = document.getElementsByClassName("copy-button")[0];
        const latitude = document.getElementById("info-latitude").innerText;
        const longitude = document.getElementById("info-longitude").innerText;
        const content = `${latitude}, ${longitude}`; // Content to copy
    
        // Use the Clipboard API to copy the content
        navigator.clipboard.writeText(content).then(() => {
            copyButton.style.backgroundColor = "#4CAF50"; // Change button color to green
            copyButton.style.fill = "white"; // Change text color to white
            copyButton.style.border = "1px solid #4CAF50"; // Change border color to white
            copyButton.style.transition = "all 0.3s ease-in-out"; // Add transition for the animation

            setTimeout(() => {
                copyButton.style.backgroundColor = ""; // Reset button color
                copyButton.style.fill = ""; // Reset text color
                copyButton.style.border = ""; // Reset border color
                copyButton.style.transition = "all 0.3s ease-in-out"; // Add transition for the animation
            }, 1000);
        }).catch(err => {
            console.error("Failed to copy content: ", err);
        });
    });


    




