from pathlib import Path

from flask import Flask


def create_app():
    base_dir = Path(__file__).resolve().parent.parent
    app = Flask(
        __name__,
        template_folder=str(base_dir / "templates"),
        static_folder=str(base_dir / "static"),
    )
    app.config.from_object("config.Config")
    from irrigation import routes
    routes.register_routes(app)
    from irrigation.database import init_db
    init_db()
    return app
