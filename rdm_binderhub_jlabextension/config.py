import json
import os
import yaml
from datetime import datetime
from urllib.parse import urlparse

from traitlets import Unicode, Bool
from traitlets.config.configurable import Configurable


ENV_PREFIX = 'RDM_BINDERHUB_'
ENV_ITEMS = ['FROM_PATH', 'TO_PATH', 'TO_DIR', 'USE_RSYNC']

def save_env_to_home():
    config_path = os.path.expanduser('~/.config/grdm/env.json')
    config_dir, _ = os.path.split(config_path)
    if not os.path.isdir(config_dir):
        os.makedirs(config_dir)
    with open(config_path, 'w') as f:
        f.write(json.dumps(
            dict([
                (k, v)
                for k, v in os.environ.items()
                if k.startswith('JUPYTERHUB_') or k.startswith('BINDER_')
            ])
        ))

def get_default_storage():
    """
    Retrieve the provider name from BINDER_REPO_URL
    """
    # BINDER_REPO_URL=https://(host)/(node_id)/(storage_provider)(/...)?
    if 'BINDER_REPO_URL' not in os.environ:
        return 'osfstorage'
    url = os.environ['BINDER_REPO_URL']
    path = urlparse(url).path.lstrip('/')
    index = path.index('/')
    storage_path = path[index + 1:]
    if '/' not in storage_path:
        return storage_path
    return storage_path[:storage_path.index('/')]

def get_default_config():
    default_storage = get_default_storage()
    yyyymmdd = datetime.now().strftime('%Y%m%d')
    to_dir = f'/mnt/rdm/{default_storage}/'
    if 'JUPYTERHUB_USER' in os.environ and 'JUPYTERHUB_SERVER_NAME' in os.environ:
        jh_user = os.environ['JUPYTERHUB_USER']
        jh_service_name = os.environ['JUPYTERHUB_SERVER_NAME']
        to_path = os.path.join(to_dir, f'result-{jh_user}-{yyyymmdd}-{jh_service_name}/')
    else:
        to_path = os.path.join(to_dir,f'/mnt/rdm/{default_storage}/result-{yyyymmdd}/')
    return dict(FROM_PATH='~/result', TO_PATH=to_path, TO_DIR=to_dir, USE_RSYNC=False)


class SyncToRDM(Configurable):

    from_path = Unicode(
        default_value=None,
        help='The path of the result directory',
        allow_none=True,
    ).tag(config=True)

    to_dir = Unicode(
        default_value=None,
        help='The path of the RDM directory - Usually rdmfs mounted directory',
        allow_none=True,
    ).tag(config=True)

    to_path = Unicode(
        default_value=None,
        help='The result path on the RDM directory - Usually subdirectory of to_dir',
        allow_none=True,
    ).tag(config=True)

    use_rsync = Bool(
        default_value=None,
        help='Use the rsync command to sync directory',
        allow_none=True,
    ).tag(config=True)

    def get_config(self):
        default_config = get_default_config()
        config_path = os.environ.get(f'{ENV_PREFIX}CONFIG',
                                    os.path.expanduser('~/.rdm-binderhub-config'))
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f.read())
        else:
            config = {}
        r = {}
        for item in ENV_ITEMS:
            r[item.lower()] = os.environ.get(f'{ENV_PREFIX}{item}',
                                            config.get(item.lower(),
                                                        default_config[item]))
        if self.from_path is not None:
            r['from_path'] = self.from_path
        if self.to_dir is not None:
            r['to_dir'] = self.to_dir
        if self.to_path is not None:
            r['to_path'] = self.to_path
        if self.use_rsync is not None:
            r['use_rsync'] = self.use_rsync

        return r
