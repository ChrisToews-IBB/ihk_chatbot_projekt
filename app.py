# app.py - Hauptdatei der Chatbot-Anwendung
# ----------------------------------------
# Dieses Modul initialisiert die Flask-Anwendung, definiert die Datenpfade
# und implementiert die Routen für das Frontend und die Backend-Logik
# (Chat-Interaktion und Ticket-Einreichung).

import json
import os
from flask import Flask, render_template, request, jsonify
from datetime import datetime

# --- Konfiguration und Initialisierung ---

# Initialisierung der Flask-Applikation
app = Flask(__name__)

# Definition der Pfade zu den Datendateien, basierend auf der Projektstruktur
DATA_DIR = 'data'
FAQ_FILE = os.path.join(DATA_DIR, 'faq.json')
TICKETS_FILE = os.path.join(DATA_DIR, 'tickets.json')

# Sicherstellen, dass das Datenverzeichnis existiert
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# --- Hilfsfunktionen für die Datenverwaltung ---

def load_data(filepath):
    """
    Lädt Daten aus einer JSON-Datei.
    Wird verwendet, um die FAQ-Daten und die simulierten Tickets zu laden.
    Wenn die Datei nicht existiert oder leer ist, wird ein leeres Dictionary oder eine leere Liste zurückgegeben.
    """
    # Überprüfen, ob die Datei existiert
    if not os.path.exists(filepath):
        print(f"INFO: Datei nicht gefunden: {filepath}. Erstelle leeres Skeleton.")
        # Erstelle eine leere Datei mit der korrekten Initialstruktur
        initial_data = {} if 'faq' in filepath else []
        with open(filepath, 'w', encoding='utf-8') as f:
             json.dump(initial_data, f, indent=4)
        return initial_data

    # Daten aus der Datei laden
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            # Fehlerbehandlung, falls die JSON-Datei fehlerhaft ist
            print(f"FEHLER: Ungültiges JSON-Format in {filepath}. Gebe leeres Dictionary/Liste zurück.")
            return {} if 'faq' in filepath else []

def save_tickets(tickets_data):
    """
    Speichert die aktuellen Ticket-Daten in der TICKETS_FILE.
    Diese Funktion simuliert die Speicherung im Ticketsystem.
    """
    try:
        with open(TICKETS_FILE, 'w', encoding='utf-8') as f:
            json.dump(tickets_data, f, indent=4)
        print(f"INFO: Ticket erfolgreich in {TICKETS_FILE} gespeichert.")
    except Exception as e:
        print(f"FEHLER: Speichern der Tickets fehlgeschlagen: {e}")


# --- Flask Routen-Definitionen ---

@app.route('/')
def index():
    """
    Hauptroute: Rendert die Startseite des Chatbots.
    Hier wird die Datei 'index.html' aus dem 'templates'-Ordner geladen.
    """
    # Lade die FAQ-Daten vor, damit sie an das Frontend übergeben werden können.
    # Die tatsächliche Logik zur Anzeige der Startfragen wird später im Frontend (chat.js) implementiert.
    faq_data = load_data(FAQ_FILE)
    return render_template('index.html', faq_data=faq_data)


@app.route('/api/chat', methods=['POST'])
def chat_interaction():
    """
    API-Route für die Chat-Interaktion.
    Nimmt eine Benutzeranfrage (meist eine ausgewählte ID) entgegen und liefert die nächste Antwort/Frage
    aus der faq.json zurück. Dies ist die Kernlogik des Klick-Chatbots.
    """
    data = request.json
    selected_id = data.get('id')

    # Stelle sicher, dass eine ID gesendet wurde, ansonsten starte beim Hauptthema
    if not selected_id:
        selected_id = 'start'

    faq_data = load_data(FAQ_FILE)

    # 1. Prüfen, ob die ID in den FAQ-Daten existiert
    if selected_id not in faq_data:
        # Fallback-Antwort, wenn eine ungültige ID gesendet wird
        return jsonify({
            'status': 'error',
            'message': 'Ungültige Auswahl. Bitte starten Sie neu.',
            'next_steps': [{'id': 'start', 'text': 'Neustart'}]
        })

    # 2. Daten für die ausgewählte ID abrufen
    current_step = faq_data[selected_id]

    # 3. Antwort zusammenstellen
    response = {
        'status': 'success',
        # Die Nachricht, die dem Benutzer im Chat angezeigt wird
        'message': current_step.get('message', 'Keine Nachricht hinterlegt.'),
        # Die möglichen Folgeaktionen (können Fragen oder abschließende Aktionen sein)
        'next_steps': current_step.get('next_steps', []),
        # Die finale Lösung, falls vorhanden (markiert diesen Schritt als Ende des Problem-Lösungspfads)
        'solution': current_step.get('solution', None)
    }

    # Spezielle Behandlung für den Fall, dass der Benutzer die Lösung als NICHT erfolgreich markiert ('issue_unresolved')
    # Wir signalisieren dem Frontend, dass das Ticket-Formular angezeigt werden soll.
    if selected_id == 'issue_unresolved':
        response['action'] = 'show_ticket_form'
        response['message'] = 'Es tut uns leid, dass wir Ihr Problem nicht lösen konnten. Bitte füllen Sie das folgende Formular aus, um ein Support-Ticket zu erstellen.'
        # Füge einen Platzhalter für den Betreff hinzu, um dem Frontend die Kategorisierung zu erleichtern
        response['subject_hint'] = f"Problem mit {current_step.get('solution', 'Unbekanntes Thema')}"

    # Spezielle Behandlung für 'issue_resolved', um den Chat abzuschließen
    elif selected_id == 'issue_resolved':
        response['action'] = 'chat_complete'
        response['message'] = 'Großartig! Es freut uns, dass Ihr Problem gelöst werden konnte. Vielen Dank für die Nutzung unseres Support-Bots.'

    # 4. JSON-Antwort zurückgeben
    return jsonify(response)


@app.route('/api/submit_ticket', methods=['POST'])
def submit_ticket():
    """
    API-Route zur simulierten Übermittlung eines Tickets.
    Nimmt die Ticket-Daten (Betreff, Beschreibung, etc.) entgegen und speichert sie in tickets.json.
    """
    ticket_data = request.json
    tickets = load_data(TICKETS_FILE) # Lade die bestehenden Tickets

    # Füge eine einfache Ticket-ID und einen Zeitstempel hinzu (Simulation)
    new_ticket = {
        'id': len(tickets) + 1,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'), # Aktueller Zeitstempel
        'status': 'Offen (Simuliert)',
        **ticket_data # Fügt alle vom Frontend gesendeten Daten hinzu
    }

    tickets.append(new_ticket) # Füge das neue Ticket zur Liste hinzu
    save_tickets(tickets) # Speichere die aktualisierte Liste

    # Rückgabe einer Erfolgsbestätigung an das Frontend
    return jsonify({
        'status': 'success',
        'message': f'Ihr Support-Ticket wurde erfolgreich unter der ID #{new_ticket["id"]} übermittelt. Wir melden uns in Kürze.',
        'ticket_id': new_ticket['id']
    })


# --- Hauptausführung ---

if __name__ == '__main__':
    # Startet den Flask-Entwicklungsserver.
    # Wichtig: Im Produktionsbetrieb sollte 'debug=False' verwendet werden.
    print(f"Starte Flask-Anwendung. Bitte stellen Sie sicher, dass die Dateien {FAQ_FILE} und {TICKETS_FILE} im Ordner '{DATA_DIR}' existieren.")
    app.run(debug=True)