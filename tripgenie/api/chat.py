import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# Gemini configuration
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash-latest")
model = genai.GenerativeModel(model_name)

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")

    if not message:
        return jsonify({"reply": "Empty message"}), 400

    try:
        if not os.environ.get("GEMINI_API_KEY"):
            return jsonify({"reply": "GEMINI_API_KEY is not set on the server."}), 500
            
        response = model.generate_content(message)
        return jsonify({"reply": response.text})
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"reply": f"Gemini Error: {str(e)}"}), 500

# For Vercel, the file should expose the Flask app as 'app'
# This allows Vercel to use it as a serverless function
if __name__ == "__main__":
    app.run(debug=True)
