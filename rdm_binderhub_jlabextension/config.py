import os
import yaml
from datetime import datetime


ENV_PREFIX = 'RDM_BINDERHUB_'
ENV_ITEMS = ['FROM_PATH', 'TO_PATH', 'USE_RSYNC']

def get_default_config():
    yyyymmdd = datetime.now().strftime('%Y%m%d')
    if 'JUPYTERHUB_USER' in os.environ and 'JUPYTERHUB_SERVER_NAME' in os.environ:
        jh_user = os.environ['JUPYTERHUB_USER']
        jh_service_name = os.environ['JUPYTERHUB_SERVER_NAME']
        to_path = f'/mnt/rdm/osfstorage/result-{jh_user}-{yyyymmdd}-{jh_service_name}/'
    else:
        to_path = f'/mnt/rdm/osfstorage/result-{yyyymmdd}/'
    return dict(FROM_PATH='~/result', TO_PATH=to_path, USE_RSYNC=False)

def get_config():
    default_config = get_default_config()
    config_path = os.environ.get(f'{ENV_PREFIX}CONFIG',
                                 os.path.expanduser('~/.rdm-binderhub-config'))
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            config = yaml.load(f.read())
    else:
        config = {}
    r = {}
    for item in ENV_ITEMS:
        r[item.lower()] = os.environ.get(f'{ENV_PREFIX}{item}',
                                         config.get(item.lower(),
                                                    default_config[item]))
    return r
