"""Server configuration for integration tests.

!! Never use this configuration in production because it
opens the server to the world and provide access to JupyterLab
JavaScript objects through the global window variable.
"""
import os
from jupyterlab.galata import configure_jupyter_server

configure_jupyter_server(c)

local = os.path.join(c.ServerApp.root_dir, 'result/')
remote = os.path.join(c.ServerApp.root_dir, 'remote/')
c.SyncToRDM.from_path = local
c.SyncToRDM.to_dir = remote
c.SyncToRDM.to_path = os.path.join(remote, 'test-result/')

# Uncomment to set server log level to debug level
# c.ServerApp.log_level = "DEBUG"
