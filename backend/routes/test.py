from flask import Flask, request, jsonify, Blueprint

test = Blueprint("test", __name__, url_prefix="/test")


@test.route("/is_alive", methods=["GET"])
def is_alive():
    return jsonify({"message": "Moji servers are alive !"})


@test.route("/is_tasks_alive", methods=["GET"])
def is_tasks_alive():
    app = Flask(__name__)
    with app.test_client() as c:
        endpoints = [
            "/api/tasks",
        ]
        results = []
        for endpoint in endpoints:
            response = c.get(endpoint)
            results.append(response.json)
        return jsonify(results)
