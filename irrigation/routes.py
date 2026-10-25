from pathlib import Path
from flask import Flask, jsonify, render_template, request, send_from_directory

from irrigation.database import clear_history_data, get_recent_events, get_recent_readings, get_settings, init_db
from irrigation.services import apply_settings, current_status_payload, manual_toggle, mode_change, process_simulation, process_telemetry
from irrigation.validation import validate_moisture, validate_mode, validate_thresholds


def register_routes(app: Flask):
    base_dir = Path(__file__).resolve().parent.parent
    frontend_dist = base_dir / "frontend" / "dist"

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
        return response

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def catch_all(path):
        # Exclude API endpoints, reset-demo, and static files from SPA catch-all
        if path.startswith("api/") or path == "reset-demo":
            return jsonify({"error": "Not found"}), 404

        # If frontend build exists, serve from dist
        if (frontend_dist / "index.html").exists():
            if path and (frontend_dist / path).exists():
                return send_from_directory(frontend_dist, path)
            return send_from_directory(frontend_dist, "index.html")

        # Fallback to legacy Jinja templates if React dist is not built
        template_map = {
            "": "index.html",
            "overview": "index.html",
            "history": "history.html",
            "events": "events.html",
            "settings": "settings.html",
            "about": "about.html",
        }
        if path in template_map:
            return render_template(template_map[path])
        return render_template("index.html")

    @app.route("/api/status")
    def api_status():
        return jsonify(current_status_payload())

    @app.route("/api/readings")
    def api_readings():
        try:
            limit = int(request.args.get("limit", 20))
            if limit <= 0:
                raise ValueError
        except ValueError:
            return jsonify({"error": "limit must be a positive integer."}), 400

        source = request.args.get("source")
        soil_status = request.args.get("soil_status")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        readings = get_recent_readings(
            limit=limit,
            source=source,
            soil_status=soil_status,
            start_date=start_date,
            end_date=end_date,
        )
        return jsonify({"readings": readings, "count": len(readings)})

    @app.route("/api/events")
    def api_events():
        try:
            limit = int(request.args.get("limit", 20))
            if limit <= 0:
                raise ValueError
        except ValueError:
            return jsonify({"error": "limit must be a positive integer."}), 400

        event_type = request.args.get("event_type")
        events = get_recent_events(limit=limit, event_type=event_type)
        return jsonify({"events": events, "count": len(events)})

    @app.route("/api/history/clear", methods=["POST"])
    def api_clear_history():
        data = request.get_json(silent=True) or {}
        target = data.get("target", "all")
        result = clear_history_data(target=target)
        return jsonify({"success": True, **result})

    @app.route("/api/simulate", methods=["POST"])
    def api_simulate():
        data = request.get_json(silent=True) or {}
        if "moisture" not in data:
            return jsonify({"error": "moisture is required."}), 400
        try:
            result = process_simulation(data["moisture"], data.get("source", "dashboard_simulation"))
            return jsonify({"success": True, **result})
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    @app.route("/api/control", methods=["POST"])
    def api_control():
        data = request.get_json(silent=True) or {}
        if "command" not in data:
            return jsonify({"error": "command is required."}), 400
        try:
            result = manual_toggle(data["command"])
            return jsonify({"success": True, "result": result})
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    @app.route("/api/mode", methods=["POST"])
    def api_mode():
        data = request.get_json(silent=True) or {}
        if "mode" not in data:
            return jsonify({"error": "mode is required."}), 400
        try:
            result = mode_change(data["mode"])
            return jsonify({"success": True, "result": result})
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    @app.route("/api/settings", methods=["POST"])
    def api_settings():
        data = request.get_json(silent=True) or {}
        dry = data.get("dry_threshold")
        wet = data.get("wet_threshold")
        if dry is None or wet is None:
            return jsonify({"error": "dry_threshold and wet_threshold are required."}), 400
        try:
            result = apply_settings(dry, wet)
            return jsonify({"success": True, **result})
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    @app.route("/api/telemetry", methods=["POST"])
    def api_telemetry():
        data = request.get_json(silent=True) or {}
        try:
            result = process_telemetry(data)
            return jsonify({"success": True, **result})
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    @app.route("/api/health")
    def api_health():
        return jsonify({"status": "ok"})

    @app.route("/reset-demo")
    def reset_demo():
        from irrigation.database import reset_demo_data
        reset_demo_data()
        return jsonify({"success": True, "message": "Demo data reset."})
