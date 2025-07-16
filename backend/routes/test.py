import time
from flask import Flask, jsonify, Blueprint

test = Blueprint("test", __name__, url_prefix="/test")


@test.route("/is_alive", methods=["GET"])
def is_alive():
    return jsonify({"message": "Moji servers are alive !"})


@test.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"})


@test.route("/internal_test", methods=["GET"])
def internal_test():
    start_time = time.time()
    app = Flask(__name__)
    with app.test_client() as c:
        endpoints = ["/api/tasks", "/api/notes", "/api/workspaces"]
        results = []
        for endpoint in endpoints:
            response = c.get(endpoint)
            results.append(response.json)
    end_time = time.time()
    return jsonify(
        {
            "message": "Internal test completed",
            "results": results,
            "duration": end_time - start_time,
        }
    )
