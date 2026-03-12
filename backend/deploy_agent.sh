#!/bin/bash

# DappleDoc Modal Deployment Script

MODAL_BIN="/Users/moshewiesenberg/Library/Python/3.9/bin/modal"

echo "Checking for Modal secrets..."
if ! $MODAL_BIN secret list | grep -q "dappledoc-secrets"; then
    echo "WARNING: 'dappledoc-secrets' not found in Modal."
    echo "Continuing anyway: the MVP can run with template-based draft generation."
    echo "Add OPENAI_API_KEY later if you want model-generated copy."
fi

echo "Deploying DappleDoc Agent to Modal..."
$MODAL_BIN deploy backend/modal_agent.py

echo "Deployment complete!"
echo "You can check the agent status at the endpoint provided above or by running: modal run backend/modal_agent.py::status"
