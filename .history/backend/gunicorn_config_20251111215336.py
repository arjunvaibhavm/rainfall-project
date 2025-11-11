# gunicorn_config.py
# This file tells our server how to run in production

# Use the PORT environment variable Render gives us, or default to 10000
import os
port = os.environ.get('PORT', '10000')

# Bind to 0.0.0.0 to accept connections from anywhere
bind = f'0.0.0.0:{port}'

# Number of workers to run
workers = 4