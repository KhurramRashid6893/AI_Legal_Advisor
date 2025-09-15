import os
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
try:
    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"Error configuring Generative AI: {e}")
    model = None

app = Flask(__name__)

# --- Prompts ---

CHATBOT_PROMPT = """
You are an AI Legal Advisor. Your response MUST be in the user's specified language: {language}.

Your primary function is to provide information based on the laws of the specified country ({country}) and, if provided, the specific state/region ({location}).

When a user describes an issue, structure your response in {language} as follows:

1.  **Analysis & Relevant Laws:** Analyze the issue, referencing laws from {country}, with specific attention to local laws from {location} if applicable.
2.  **Suggested Legal Process:** Provide a step-by-step legal process.
3.  **Appropriate Forum:** Suggest the correct authority to approach (e.g., local police in {location}, State High Court).
4.  **Case Risk & Outcome Analysis (Qualitative):** Provide a general analysis of the case's strengths and weaknesses. DO NOT give a statistical probability.

**Crucial Guidelines:**
* Respond ONLY in {language}.
* When citing legal sections (e.g., IPC Section 302), keep the citation in English for universal legal reference.
* Conclude EVERY response with a bold disclaimer in {language}: "**Disclaimer: This is for educational purposes and is not legal advice. Consult a qualified human lawyer for formal advice.**"
"""

DRAFTER_PROMPT = """
You are an AI assistant specialized in drafting legal documents. Your task is to generate a basic draft based on the user's provided details and the laws of the specified country.

**Instructions:**
1.  Generate a draft for a **{doc_type}**.
2.  The document must be compliant with the laws of **{country}**.
3.  Use the following details provided by the user:
    {details}
4.  Structure the document with clear headings, clauses, and placeholders.
5.  Add a clear disclaimer at the very top: "**This is an AI-generated draft. It must be reviewed by a qualified lawyer before use.**"
"""

# --- Page Routes ---

@app.route("/")
def index():
    return render_template("index.html", page='chatbot')

@app.route("/drafter")
def drafter():
    return render_template("drafter.html", page='drafter')

@app.route("/navigator")
def navigator():
    return render_template("navigator.html", page='navigator')

# --- API Endpoints ---

@app.route("/api/get-response", methods=["POST"])
def get_response():
    """API endpoint for the chatbot."""
    if not model: return jsonify({"error": "AI model not initialized"}), 500
    try:
        data = request.json
        user_query = data.get("message", "")
        country = data.get("country", "India")
        language = data.get("language", "English")
        location = data.get("location", "Not provided")
        
        if not user_query: return jsonify({"error": "No message provided"}), 400

        prompt = CHATBOT_PROMPT.format(language=language, country=country, location=location)
        full_prompt = f"{prompt}\n\nHere is the user's issue: \"{user_query}\""
        
        response = model.generate_content(full_prompt)
        return jsonify({"reply": response.text})
    except Exception as e:
        return jsonify({"error": f"An error occurred: {e}"}), 500


@app.route("/api/draft-document", methods=["POST"])
def draft_document():
    """API endpoint for the document drafter."""
    if not model: return jsonify({"error": "AI model not initialized"}), 500
    try:
        data = request.json
        doc_type = data.get("doc_type")
        country = data.get("country", "India")
        details = data.get("details", "")

        if not doc_type or not details: return jsonify({"error": "Document type or details missing"}), 400

        prompt = DRAFTER_PROMPT.format(doc_type=doc_type, country=country, details=details)
        response = model.generate_content(prompt)
        return jsonify({"draft": response.text})
    except Exception as e:
        return jsonify({"error": f"An error occurred: {e}"}), 500


if __name__ == "__main__":
    app.run(debug=True)