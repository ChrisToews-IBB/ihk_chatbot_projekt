// JavaScript-Logik für den Chatbot

// Zähler für unverstandene Nachrichten. Wird im Frontend geführt und an das Backend gesendet.
let unknownMessageCount = 0;

// Die Hauptfunktion, die die Benutzernachricht an den Flask-Server sendet
async function sendeNachricht() {
    const eingabeFeld = document.getElementById('benutzer-eingabe');
    const nachricht = eingabeFeld.value.trim();
    
    // 1. Eingabe prüfen
    if (nachricht === "") {
        return; 
    }
    
    // 2. Nachricht des Benutzers im Chat-Fenster anzeigen
    zeigeNachricht('Sie', nachricht, 'user');
    eingabeFeld.value = ''; // Eingabefeld leeren
    
    // 3. AJAX-Aufruf (fetch) an das Flask-Backend
    try {
        const response = await fetch('/get_response', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            // Die Nachricht und der Zähler werden als JSON an Flask gesendet
            body: JSON.stringify({ 
                message: nachricht,
                unknown_count: unknownMessageCount // Aktuellen Zählerstand senden
            }) 
        });

        // 4. Antwort vom Server (JSON) verarbeiten
        const data = await response.json();

        // 5. Antwort des Bots und Logik verarbeiten
        if (data.status === 'success') {
            // FAQ gefunden: Zähler zurücksetzen
            unknownMessageCount = 0;
            zeigeNachricht('Bot', data.response, 'bot');
        } else if (data.status === 'rephrase') {
            // Soft-Fallback: Bot bittet um Umformulierung.
            unknownMessageCount = data.new_count; // Zähler erhöhen
            zeigeNachricht('Bot', data.response, 'bot');
        } else if (data.status === 'unrecognized') {
            // Hard-Fallback: Ticket anbieten.
            unknownMessageCount = 0; // Zähler zurücksetzen
            
            // Bot-Antwort anzeigen
            zeigeNachricht('Bot', data.response, 'bot');

            // Button zum Chat-Fenster hinzufügen
            const chatFenster = document.getElementById('chat-fenster');
            const buttonWrapper = document.createElement('div');
            buttonWrapper.classList.add('bot'); // Damit der Button rechts angezeigt wird
            
            const ticketButton = document.createElement('button');
            ticketButton.textContent = 'Ja, Ticket erstellen';
            ticketButton.classList.add('fallback-button');
            ticketButton.onclick = () => createTicket(nachricht); // Die letzte unbekannte Nachricht übergeben
            
            buttonWrapper.appendChild(ticketButton);
            chatFenster.appendChild(buttonWrapper);
            
        } else {
            zeigeNachricht('Bot', 'Ein Fehler ist aufgetreten.', 'bot');
        }

    } catch (error) {
        console.error('Fehler bei der Kommunikation mit dem Server:', error);
        zeigeNachricht('Bot', 'Fehler: Konnte keine Verbindung zum Server herstellen.', 'bot');
    }

    // Scrolle ans Ende, nachdem alle Elemente hinzugefügt wurden
    document.getElementById('chat-fenster').scrollTop = document.getElementById('chat-fenster').scrollHeight;
}

// Hilfsfunktion, um Nachrichten dem Chat-Fenster hinzuzufügen
function zeigeNachricht(sender, text, type) {
    // Entfernt den vorherigen Ticket-Button, falls vorhanden
    const oldButton = document.querySelector('.fallback-button');
    if (oldButton) {
        oldButton.closest('.bot').remove(); // Entfernt den Button-Wrapper
    }
    
    const chatFenster = document.getElementById('chat-fenster');
    const nachrichtElement = document.createElement('p');
    nachrichtElement.classList.add(type); 
    nachrichtElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
    
    chatFenster.appendChild(nachrichtElement);
}

// Funktion zur Behandlung der Ticket-Erstellung (Hard-Fallback)
async function createTicket(problemDescription) {
    // Kurze Rückmeldung im Chat
    zeigeNachricht('Bot', 'Erstelle Ticket...', 'bot');

    try {
        const response = await fetch('/create_ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                description: problemDescription,
                user: "Max Mustermann (simuliert)" 
            })
        });

        const data = await response.json();

        if (data.status === 'ticket_created') {
            // Erfolgreich: Weiterleitung zur Bestätigungsseite mit der ID
            window.location.href = `/ticket?id=${data.ticket_id}`;
        } else {
            zeigeNachricht('Bot', 'Fehler beim Erstellen des Tickets.', 'bot');
        }
    } catch (error) {
        console.error('Fehler bei der Ticket-Erstellung:', error);
        zeigeNachricht('Bot', 'Interner Fehler: Konnte Ticket-API nicht erreichen.', 'bot');
    }
}

// Event-Listener beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    // Nachricht senden bei Drücken der Enter-Taste
    document.getElementById('benutzer-eingabe').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendeNachricht();
        }
    });

    // Nachricht senden bei Klick auf den Button
    document.getElementById('sende-button').addEventListener('click', sendeNachricht);
});