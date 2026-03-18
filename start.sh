#!/bin/bash
cd backend
pip install -r requirements.txt
gunicorn minimal_app:app --bind 0.0.0.0:$PORT