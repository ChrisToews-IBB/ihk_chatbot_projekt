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
        return {"intents": []}
    
# Daten einmal beim Start der App laden
faq_data = load_faq_data()

@app.route("/")
def home():
    # Diese Route liefert die HTML-Oberfläche
    return render_template("index.html")

# Route 2: Chatbot-API (verarbeitet Anfragen und liefert Antworten)
@app.route("/get_response", methods=["POST"])
def get_chatbot_response():
    """Verarbeitet die Benutzernachricht und gibt eine Bot-Antwort zurück."""
    
    # 1. Benutzer-Nachricht aus dem POST-Request extrahieren
    user_message = request.json.get("message", "").lower()
    
    # Der Zähler für aufeinanderfolgende unbekannte Nachrichten (von 0 bis 2)
    unknown_count = request.json.get("unknown_count", 0) 
    
    # Wir erlauben 3 Versuche (Zähler 0, 1, 2)
    MAX_REPHRASE_COUNT = 2 
    
    best_match = None
    
    # Durchsuche die FAQ-Datenbank
    for intent in faq_data.get("intents", []):
        for pattern in intent["patterns"]:
            if pattern in user_message:
                best_match = intent
                break 
        if best_match:
            break

    # 2. Antwort generieren
    if best_match:
        # Erfolg: Passende FAQ-Antwort senden
        response = random.choice(best_match["responses"])
        return jsonify({"status": "success", "response": response})
        
    elif unknown_count < MAX_REPHRASE_COUNT:
        # STUFE 1: Soft-Fallback (Versuche 1 und 2)
        # Wir bitten um Umformulierung.
        soft_fallback_message = "Das habe ich leider nicht verstanden. Könnten Sie Ihre Frage bitte anders formulieren?".format(unknown_count + 1, MAX_REPHRASE_COUNT + 1)
        return jsonify({
            "status": "rephrase", 
            "response": soft_fallback_message
        })
        
    else:
        # STUFE 2: Hard-Fallback (Versuch 3)
        # Jetzt bieten wir das Ticket an.
        hard_fallback_message = "Entschuldigung, ich verstehe das Anliegen immer noch nicht. Möchten Sie, dass ich ein Support-Ticket für Sie erstelle?"
        return jsonify({
            "status": "unrecognized", 
            "response": hard_fallback_message
        })

if __name__ == "__main__":
    # Startet den Flask-Server
    app.run(debug=True)
