document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const countrySelector = document.getElementById('country-selector');
    const languageSelector = document.getElementById('language-selector');
    const locationBar = document.getElementById('location-bar');
    
    let userLocation = 'Not provided';

    // --- Geolocation ---
    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    // Using a free reverse geocoding API to get state/city
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        const state = data.address.state || '';
                        const country = data.address.country || '';
                        userLocation = `${state}, ${country}`;
                        locationBar.textContent = `📍 Location detected: ${userLocation}`;
                    } catch (e) {
                         userLocation = 'Location lookup failed';
                         locationBar.textContent = '⚠️ Could not determine location details.';
                    }
                },
                () => {
                    userLocation = 'Permission denied';
                    locationBar.textContent = '⚠️ Location permission denied. Advice will be generalized.';
                }
            );
        } else {
            userLocation = 'Not supported';
            locationBar.textContent = '⚠️ Geolocation is not supported by this browser.';
        }
    };

    // Get location on page load
    getLocation();

    const addMessage = (content, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        contentDiv.innerText = content;
        messageDiv.appendChild(contentDiv);
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const sendMessage = async () => {
        const query = userInput.value.trim();
        const country = countrySelector.value;
        const language = languageSelector.value;
        if (query === '') return;

        addMessage(query, 'user');
        userInput.value = '';
        addMessage('Analyzing your query...', 'ai');

        try {
            const response = await fetch('/api/get-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: query, 
                    country: country,
                    language: language,
                    location: userLocation 
                }),
            });
            
            chatBox.removeChild(chatBox.lastChild);

            if (!response.ok) {
                const errorData = await response.json();
                addMessage(`Error: ${errorData.error || 'Failed to get response.'}`, 'ai');
                return;
            }

            const data = await response.json();
            addMessage(data.reply, 'ai');

        } catch (error) {
            chatBox.removeChild(chatBox.lastChild);
            addMessage('Error connecting to the server. Please try again.', 'ai');
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
});