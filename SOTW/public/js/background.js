// background.js
// The js that controls the elements in the UI of the background elements of the page

const backgroundText = document.createElement('div');
backgroundText.id = "backgroundText";

// Create repeating text
var yearString = "";
for(var i = 0; i < 400; i++) {
    yearString += "2024 ";
    if((i + 1) % 20 === 0) {
        yearString += "\n";
    }
}

backgroundText.textContent = yearString;
backgroundText.ariaHidden = true;

document.addEventListener("mousemove", function(event) {
    const parallaxElement = document.getElementById("backgroundText");
    const parallaxElementImage = document.getElementById("backgroundImageGrid");
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const offsetX = -(window.innerWidth / 2 - mouseX) / 20;
    const offsetY = -(window.innerHeight / 2 - mouseY) / 20;
    parallaxElement.style.transform = `translate(-50%, -50%) rotate(-12deg) translate(${offsetX}px, ${offsetY}px)`;
    parallaxElementImage.style.transform = `translate(-50%, -50%) rotate(12deg) translate(${offsetX}px, ${offsetY}px)`;
});

document.body.appendChild(backgroundText);

const backgroundImage = document.createElement('div');
backgroundImage.id = "backgroundImageGrid";

for(var i = 0; i < 20; ++i) {
    const image = document.createElement('img');
    image.src = "img/pixelArt.png";
    image.className = "pixelImage";
    image.ariaHidden = true;

    backgroundImage.appendChild(image);
}

document.body.appendChild(backgroundImage);
