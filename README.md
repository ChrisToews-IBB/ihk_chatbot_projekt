# IHK Chatbot Projekt

Ein regelbasierter Support-Chatbot als IHK-Abschlussprojekt. Nutzer klicken sich durch vordefinierte Fragen und Antworten — bei ungelöstem Problem wird automatisch ein Support-Ticket erstellt und gespeichert.

## Was das Projekt macht

Der Chatbot führt den Nutzer Schritt für Schritt durch einen Entscheidungsbaum:

1. Der Nutzer wählt ein Thema aus vordefinierten Optionen
2. Der Bot zeigt passende Lösungsvorschläge aus der `faq.json`
3. Hat sich das Problem gelöst → Chat wird abgeschlossen
4. Hat sich das Problem **nicht** gelöst → Ticket-Formular öffnet sich automatisch
5. Das Ticket wird mit Zeitstempel und ID in `tickets.json` gespeichert

## Projektstruktur

```
ihk_chatbot_projekt/
├── app.py                  # Flask-Backend, API-Routen, Ticket-Logik
├── requirements.txt        # Python-Dependencies
├── data/
│   ├── faq.json            # Entscheidungsbaum (Fragen, Antworten, Folgeschritte)
│   └── tickets.json        # Gespeicherte Support-Tickets
├── templates/
│   └── index.html          # Haupt-Frontend (Chat-Interface)
├── static/                 # CSS, JavaScript, Assets
└── docs/                   # Projektdokumentation
```

## Tech Stack

| Komponente | Technologie |
|---|---|
| Backend | Python + Flask |
| Frontend | HTML / CSS / JavaScript |
| Datenspeicher | JSON-Dateien |
| Chatlogik | Regelbasierter Entscheidungsbaum |

## API-Endpunkte

**`POST /api/chat`**
Nimmt eine ausgewählte Schritt-ID entgegen und gibt die nächste Nachricht sowie mögliche Folgeoptionen zurück.

```json
// Request
{ "id": "start" }

// Response
{
  "status": "success",
  "message": "Womit kann ich helfen?",
  "next_steps": [{ "id": "netzwerk", "text": "Netzwerkproblem" }],
  "solution": null
}
```

**`POST /api/submit_ticket`**
Speichert ein Support-Ticket in `tickets.json` mit automatischer ID und Zeitstempel.

```json
// Response
{
  "status": "success",
  "message": "Ihr Support-Ticket wurde erfolgreich unter der ID #1 übermittelt.",
  "ticket_id": 1
}
```

## Installation & Start

```bash
# 1. Repository klonen
git clone https://github.com/ChrisToews-IBB/ihk_chatbot_projekt.git
cd ihk_chatbot_projekt

# 2. Dependencies installieren
pip install -r requirements.txt

# 3. Server starten
python app.py
```

Dann im Browser öffnen: [http://localhost:5000](http://localhost:5000)

> **Hinweis:** Die Dateien `data/faq.json` und `data/tickets.json` werden beim ersten Start automatisch angelegt, falls sie noch nicht existieren.

### Optionales: Virtuelles Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

## faq.json — Aufbau des Entscheidungsbaums

Der gesamte Chatablauf wird über `data/faq.json` gesteuert. Jeder Eintrag hat eine eindeutige ID:

```json
{
  "start": {
    "message": "Womit kann ich dir helfen?",
    "next_steps": [
      { "id": "netzwerk", "text": "Netzwerkproblem" },
      { "id": "drucker",  "text": "Druckerproblem"  }
    ]
  },
  "netzwerk": {
    "message": "Hast du bereits den Router neu gestartet?",
    "solution": "Router-Neustart",
    "next_steps": [
      { "id": "issue_resolved",   "text": "Ja, Problem gelöst" },
      { "id": "issue_unresolved", "text": "Nein, Problem besteht noch" }
    ]
  }
}
```

Die reservierten IDs `issue_resolved` und `issue_unresolved` steuern den Abschluss des Chats bzw. die Ticket-Erstellung.

## Projektkontext

Dieses Projekt wurde als **IHK-Abschlussprojekt** entwickelt. Ziel war es, einen einfachen, wartbaren Support-Chatbot ohne externe KI-Dienste zu bauen — vollständig regelbasiert und lokal betreibbar.