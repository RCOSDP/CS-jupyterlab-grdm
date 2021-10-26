
import json
from pathlib import Path

from tornado.ioloop import IOLoop

from ._version import __version__

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": data["name"]
    }]



from . import server


# nbextension
def _jupyter_nbextension_paths():
    return [dict(section="tree",
                 src="nbextension",
                 dest="rdm_binderhub_jlabextension",
                 require="rdm_binderhub_jlabextension/main"),
            dict(section="notebook",
                 src="nbextension",
                 dest="rdm_binderhub_jlabextension",
                 require="rdm_binderhub_jlabextension/main")]


def _jupyter_server_extension_points():
    return [{
        "module": "rdm_binderhub_jlabextension"
    }]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    server.register_routes(server_app, server_app.web_app)
    IOLoop.current().add_callback(server.task_worker.watch_queue)
    server_app.log.info("Registered GRDM extension at URL path /rdm-binderhub-jlabextension")

# For backward compatibility with notebook server - useful for Binder/JupyterHub
load_jupyter_server_extension = _load_jupyter_server_extension
