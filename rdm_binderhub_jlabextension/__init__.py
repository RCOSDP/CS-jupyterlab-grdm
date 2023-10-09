from tornado.ioloop import IOLoop

try:
    from ._version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode: https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings
    warnings.warn("Importing 'rdm_binderhub_jlabextension' outside a proper installation.")
    __version__ = "dev"
from .handlers import setup_handlers
from .config import SyncToRDM, save_env_to_home
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


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "rdm-binderhub-jlabextension"
    }]


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
    setup_handlers(SyncToRDM(parent=server_app), server_app.web_app)
    IOLoop.current().add_callback(server.task_worker.watch_queue)
    save_env_to_home()
    name = "rdm_binderhub_jlabextension"
    server_app.log.info(f"Registered {name} server extension")
