// chat.js - Logik für die Chatbot-Interaktion und das UI-Handling
// ---------------------------------------------------------------------

// --- Globale Variablen und DOM-Elemente ---
const chatContainer = document.getElementById('chatbot-container');
const toggleButton = document.getElementById('chatbot-toggle-button');
const chatLog = document.getElementById('chat-log');
const optionsContainer = document.getElementById('options-container');
const ticketFormContainer = document.getElementById('ticket-form-container');
const ticketForm = document.getElementById('ticket-form');

// API-Endpunkte
const CHAT_API_URL = '/api/chat';
const TICKET_API_URL = '/api/submit_ticket';

// Speichert den Verlauf des aktuellen Gesprächs (für zukünftige Nutzung, z.B. Ticket-Betreff)
let conversationHistory = [];
let chatStarted = false;

// --- UI-Funktionen ---

function toggleChatbot() {
    /**
     * Schaltet zwischen minimiertem und maximiertem Zustand des Chatbots um.
     * Nutzt die 'hidden' Klasse von Tailwind CSS.
     */
    const isHidden = chatContainer.classList.contains('hidden');

    if (isHidden) {
        // Chatbot öffnen
        chatContainer.classList.remove('hidden');
        // Icon des Toggle-Buttons verstecken, da das Chat-Fenster sichtbar ist
        toggleButton.classList.add('hidden');
        
        // Beim Öffnen: Startnachricht oder Fortsetzung des Chats laden
        // Wenn der ChatLog leer ist, starten wir die Konversation
        if (!chatStarted) { 
            // Führe den ersten Schritt aus ('start' ID ist in index.html definiert)
            sendMessage(START_CHAT_ID);
            chatStarted = true;
        } else {
             // Stelle sicher, dass der Chat nach unten scrollt
            scrollToBottom();
        }

    } else {
        // Chatbot minimieren
        chatContainer.classList.add('hidden');
        toggleButton.classList.remove('hidden');
    }
}

function displayBotMessage(message) {
    /**
     * Fügt eine neue Nachricht des Bots zum Chat-Verlauf hinzu.
     */
    const messageElement = document.createElement('div');
    messageElement.className = 'flex justify-start';
    messageElement.innerHTML = `
        <div class="bg-white p-3 rounded-xl shadow max-w-[80%] animate-in fade-in duration-300">
            <p class="text-sm font-semibold text-soferu-blue">Bot</p>
            <p class="text-gray-800">${message}</p>
        </div>
    `;
    chatLog.appendChild(messageElement);
    scrollToBottom();
}

function displayUserChoice(text) {
    /**
     * Fügt die Auswahl des Benutzers zum Chat-Verlauf hinzu.
     */
    const choiceElement = document.createElement('div');
    choiceElement.className = 'flex justify-end';
    choiceElement.innerHTML = `
        <div class="bg-soferu-blue text-white p-3 rounded-xl shadow max-w-[80%] animate-in fade-in duration-300">
            <p>${text}</p>
        </div>
    `;
    chatLog.appendChild(choiceElement);
    scrollToBottom();
}

function displayOptions(options) {
    /**
     * Zeigt die klickbaren Optionen (nächste Schritte) an.
     */
    optionsContainer.innerHTML = ''; // Vorherige Optionen leeren

    if (options.length === 0) {
        // Wenn keine Optionen vorhanden sind, zeige nur den Neustart-Button
        optionsContainer.innerHTML = `
            <button onclick="sendMessage('start')" class="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 transition duration-150">
                Neustart
            </button>
        `;
        return;
    }

    options.forEach(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'w-full py-2 px-4 border border-soferu-blue rounded-lg text-sm font-medium text-soferu-blue bg-soferu-light hover:bg-soferu-blue hover:text-white transition duration-150 shadow-md';
        button.textContent = option.text;
        
        // Füge den Event-Listener hinzu: Bei Klick wird die Chat-Interaktion mit der ID gestartet
        button.onclick = () => {
            // Zeige die Auswahl des Benutzers an, bevor die API aufgerufen wird
            displayUserChoice(option.text);
            
            // Füge die Auswahl zur Konversationshistorie hinzu
            conversationHistory.push({ role: 'user', text: option.text, id: option.id });
            
            // Sende die ID an den Server
            sendMessage(option.id);
        };
        optionsContainer.appendChild(button);
    });
}

function scrollToBottom() {
    /**
     * Scrollt den Chat-Verlauf immer zum neuesten Element.
     */
    chatLog.scrollTop = chatLog.scrollHeight;
}

// --- Backend-Kommunikation ---

async function sendMessage(id) {
    /**
     * Sendet die ausgewählte ID an den Flask-Server, um die nächste Antwort zu erhalten.
     * @param {string} id - Die ID der ausgewählten Option aus faq.json.
     */
    
    // Deaktiviere Optionen, während die Antwort vom Server geladen wird
    optionsContainer.innerHTML = '<p class="text-center text-gray-500">Wird geladen...</p>';
    hideTicketForm(); // Verstecke das Ticket-Formular

    try {
        const response = await fetch(CHAT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id }),
        });

        const result = await response.json();

        if (result.status === 'success') {
            
            // 1. Bot-Antwort anzeigen
            displayBotMessage(result.message);
            
            // 2. Antwort zur Konversationshistorie hinzufügen
            conversationHistory.push({ role: 'bot', text: result.message, id: id });
            
            // 3. Nächste Schritte basierend auf der Server-Antwort verarbeiten
            
            if (result.action === 'show_ticket_form') {
                // Der Server signalisiert, dass das Ticket-Formular angezeigt werden soll
                showTicketForm(result.subject_hint || 'Unbekanntes Problem');
            
            } else if (result.action === 'chat_complete') {
                // Der Chat ist abgeschlossen (Problem gelöst)
                optionsContainer.innerHTML = `
                <p class="text-green-600 font-semibold text-center">Danke für Ihre Nutzung!</p>
                <button onclick="sendMessage('start')" class="w-full mt-2 py-2 px-4 rounded-md bg-soferu-blue text-white hover:bg-blue-700 transition">Neu starten</button>
                `;
                
            } else {
                // Normale Chat-Interaktion: Zeige die nächsten Optionen
                displayOptions(result.next_steps);
            }

        } else {
            displayBotMessage(`Ein Fehler ist aufgetreten: ${result.message}`);
            displayOptions([{id: 'start', text: 'Neustart versuchen'}]);
        }

    } catch (error) {
        console.error('Fehler beim Abrufen der Chat-Antwort:', error);
        displayBotMessage('Entschuldigung, es gab ein technisches Problem. Bitte versuchen Sie es später erneut.');
        displayOptions([{id: 'start', text: 'Neustart versuchen'}]);
    }
}


// --- Ticket-Formular Logik ---

function showTicketForm(subjectHint) {
    /**
     * Blendet das Ticket-Formular ein und setzt den Betreff-Vorschlag.
     */
    optionsContainer.classList.add('hidden');
    ticketFormContainer.classList.remove('hidden');
    
    const subjectInput = document.getElementById('ticket-subject');
    // Setze den Betreff basierend auf der letzten bekannten Problemkategorie
    subjectInput.value = subjectHint; 
    
    // Optional: Füge die gesamte Konversationshistorie in das Beschreibungsfeld ein
    const descriptionInput = document.getElementById('ticket-description');
    const historyText = conversationHistory
        .map(entry => `${entry.role.toUpperCase()}: ${entry.text}`)
        .join('\n');
    descriptionInput.value = `Konversationsverlauf:\n---\n${historyText}\n\n--- \nBitte beschreiben Sie das Problem genauer:`;
    
    scrollToBottom();
}

function hideTicketForm() {
    /**
     * Versteckt das Ticket-Formular.
     */
    optionsContainer.classList.remove('hidden');
    ticketFormContainer.classList.add('hidden');
}


// Event Listener für die Ticket-Formular-Übermittlung
ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Verhindert das Standard-Senden des Formulars (Seiten-Reload)
    
    // Sammle Formulardaten
    const subject = document.getElementById('ticket-subject').value;
    const description = document.getElementById('ticket-description').value;
    const email = document.getElementById('ticket-email').value;
    
    // Sende Lade-Feedback
    optionsContainer.innerHTML = '';
    displayBotMessage('Sende Ticket an das Soferu-System...');
    hideTicketForm();

    try {
        const response = await fetch(TICKET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ subject, description, email }),
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            displayBotMessage(result.message); // Zeige die Erfolgsmeldung des Servers
            
            // Chat abschließen
            optionsContainer.innerHTML = `
            <p class="text-green-600 font-semibold text-center">Vielen Dank für Ihre Anfrage!</p>
            <button onclick="sendMessage('start')" class="w-full mt-2 py-2 px-4 rounded-md bg-soferu-blue text-white hover:bg-blue-700 transition">Neu starten</button>
            `;
        } else {
            displayBotMessage(`Fehler bei der Ticket-Übermittlung: ${result.message}`);
            displayOptions([{id: 'start', text: 'Neustart versuchen'}]);
        }

    } catch (error) {
        console.error('Fehler bei der Ticket-Übermittlung:', error);
        displayBotMessage('Entschuldigung, beim Senden des Tickets ist ein Netzwerkfehler aufgetreten.');
        displayOptions([{id: 'start', text: 'Neustart versuchen'}]);
    }
});

// Initialisierungs-Logik: Stellt sicher, dass die Icons initialisiert werden
document.addEventListener('DOMContentLoaded', () => {
    // Wenn die Seite geladen ist, kann der Benutzer den Chatbot öffnen.
    // Die toggleChatbot Funktion wird durch Klick auf den Button ausgelöst.
    console.log('Chatbot-Logik geladen. Bereit für Interaktion.');
});
