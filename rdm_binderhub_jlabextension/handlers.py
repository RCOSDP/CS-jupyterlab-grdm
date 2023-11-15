from jupyter_server.utils import url_path_join

from .server import FilesHandler


def setup_handlers(app, web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    handler_options = app.get_config()
    route_pattern = url_path_join(base_url, "rdm-binderhub-jlabextension", "files")
    handlers = [(route_pattern, FilesHandler, handler_options)]
    web_app.add_handlers(host_pattern, handlers)
