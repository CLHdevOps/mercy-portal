from flask import Flask, request, jsonify
from flask_cors import CORS
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from azure.ai.agents.models import ListSortOrder
import os

app = Flask(__name__)
CORS(app)

# Azure AI Project configuration
AGENT_ENDPOINT = "https://devopsaifoundry.services.ai.azure.com/api/projects/devopsaifoundry-project"
AGENT_ID = "asst_BWQLf9pcF6RX83wc2vVNXImu"

project = AIProjectClient(
    credential=DefaultAzureCredential(),
    endpoint=AGENT_ENDPOINT
)

@app.route("/api/ask", methods=["POST"])
def ask_agent():
    """
    Endpoint for the Agent Assistant to query the Azure AI agent.
    Expects JSON body: { "prompt": "user question" }
    Returns JSON: { "answer": "agent response", "sources": [...] }
    """
    try:
        data = request.get_json()
        prompt = data.get("prompt", "").strip()

        if not prompt:
            return jsonify({"error": "No prompt provided"}), 400

        # Get the agent
        agent = project.agents.get_agent(AGENT_ID)

        # Create a new thread for this conversation
        thread = project.agents.threads.create()

        # Send user message
        message = project.agents.messages.create(
            thread_id=thread.id,
            role="user",
            content=prompt
        )

        # Run the agent
        run = project.agents.runs.create_and_process(
            thread_id=thread.id,
            agent_id=agent.id
        )

        if run.status == "failed":
            return jsonify({
                "error": f"Agent run failed: {run.last_error}"
            }), 500

        # Get messages from the thread
        messages = project.agents.messages.list(
            thread_id=thread.id,
            order=ListSortOrder.ASCENDING
        )

        # Extract the agent's response (last message)
        agent_response = ""
        for message in messages:
            if message.role == "assistant" and message.text_messages:
                agent_response = message.text_messages[-1].text.value

        return jsonify({
            "answer": agent_response,
            "sources": []  # Can be populated with document references if needed
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "agent_endpoint": AGENT_ENDPOINT})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)