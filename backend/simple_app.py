from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def root():
    return jsonify({
        "message": "Soccer Chemistry API",
        "status": "running",
        "version": "1.0.0"
    })

@app.route('/api/health')
def health():
    return jsonify({
        "status": "healthy",
        "message": "API is running"
    })

@app.route('/api/test')
def test():
    return jsonify({
        "message": "Test successful",
        "status": "ok"
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)