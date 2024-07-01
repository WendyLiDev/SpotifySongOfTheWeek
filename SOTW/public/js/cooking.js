// public/cooking.js

// Get the recentlyPlayed embedded in the HTML
const recentlyPlayed = JSON.parse('<%= data %>');

// Function to render recentlyPlayed to the page
function renderData(recentlyPlayed) {
    const recentlyPlayedDiv = document.getElementById('recentlyPlayed');
    if (recentlyPlayed && recentlyPlayed.length > 0) {
        const ul = document.createElement('ul');
        recentlyPlayed.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
        });
        recentlyPlayedDiv.appendChild(ul);
    } else {
        recentlyPlayedDiv.textContent = 'No recentlyPlayed available';
    }
}

// Call the function to render recentlyPlayed
// renderData(recentlyPlayed);

// TODO I DONT THINK THIS IS NEEDED
