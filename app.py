import json
import random
from flask import Flask, render_template, request, jsonify
# 'request' brauchen wir, um Daten vom Frontend zu empfangen
# 'jsonify' brauchen wir, um Daten an das Frontend zurückzusenden

app = Flask(__name__)

# Hilfsfunktion zum Laden der FAQ-Daten
def load_faq_data(file_path='data/faq.json'):
    try:
        with open(file_path, 'r', encoding= 'utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"FEHLER: Die Datei {file_path} wurde nicht gefunden.")
        return {"intents: []"}
    
# Daten einmal beim Start der App laden
faq_data = load_faq_data

@app.route("/")
def home():
    # Diese Route liefert die HTML-Oberfläche
    return render_template("index.html")

@app.route("/get_response", methods=["POST"])
def get_chatbot_response():
    # 1. Benutzer-Nachricht aus dem POST-Request extrahieren
    user_message = request.json.get("message").lower()

    # 2. Beste Antwort finden
    best_match = None

    # Durch alle Intents (Themen) in der FAQ-Datenbank iterieren
    for intent in faq_data.get("intents", []):
        # Überprüfen, ob eines der Keywords (patterns) in der Benutzernachricht enthalten ist
        for pattern in intent["patterns"]:
            # Wir machen hier einen einfachen Vergleich: Ist das Pattern Teil der Nachricht?
            if pattern in user_message:
                best_match = intent
                break # Das erste gefundene Pattern reicht aus
        if best_match:
            break

    # 3. Antwort generieren
    if best_match:
        # Eine zufällige Antwort aus der Responses-Liste auswählen
        response = random.choice(best_match["responses"])

        # Das Senden von JSON-Daten ist der Schlüssel zur Kommunikation
        return jsonify({"status": "success", "response": response})
    else:
        # Kein Intent gefunden, hier erfolgt später der Fallback zur Ticket-Erstellung
        return jsonify({"status": "unrecognized", "response": "Entschuldigung, ich habe dieses Anliegen nicht verstanden. Möchten Sie, dass ich ein Support-Ticket für Sie erstelle?"})

if __name__ == "__main__":
    # Startet den Flask-Server
    app.run(debug=True)
