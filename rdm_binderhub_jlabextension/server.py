import os

import tornado.web
from jupyter_server.base.handlers import APIHandler

from .worker import TaskWorker


task_worker = TaskWorker.get_instance()


class FilesHandler(APIHandler):
    def initialize(self, from_path, to_path, to_dir, use_rsync):
        self.from_path = from_path
        self.to_path = to_path
        self.to_dir = to_dir
        self.use_rsync = use_rsync
        self.log.info(f'Initialized: from_path={self.from_path}, to_path={self.to_path}, to_dir={self.to_dir}, use_rsync={self.use_rsync}')

    def _get_to_path(self):
        if os.path.exists(self.to_dir):
            return self.to_dir
        return None

    @tornado.web.authenticated
    async def get(self):
        if task_worker is None:
            syncing = None
            last_result = None
        else:
            syncing = task_worker.performing is not None
            if task_worker.performed is None:
                last_result = None
            else:
                stdout = task_worker.performed.stdout
                stderr = task_worker.performed.stderr
                last_result = {
                    'exit_code': task_worker.performed.exit_code,
                    'stdout': stdout.decode('utf8', errors='ignore') if stdout is not None else None,
                    'stderr': stderr.decode('utf8', errors='ignore') if stderr is not None else None,
                } if task_worker.performed is not None else None
        resp = {
            'to_dir': self._get_to_path(),
            'syncing': syncing,
            'last_result': last_result,
            'action': None,
        }
        action = self.get_query_argument('action', default=None)
        if action != 'sync':
            self.write(resp)
            return
        if not os.path.exists(os.path.expanduser(self.from_path)):
            self.log.info(f'Directory not exists: {self.from_path}')
            resp['action'] = {
                'id': 'no_content',
                'args': [self.from_path],
            }
            self.write(resp)
            return
        if not os.path.isdir(os.path.expanduser(self.from_path)):
            self.log.info(f'Result is not directory: {self.from_path}')
            resp['action'] = {
                'id': 'not_directory',
                'args': [self.from_path],
            }
            self.write(resp)
            return
        if len(os.listdir(os.path.expanduser(self.from_path))) == 0:
            self.log.info(f'Directory empty: {self.from_path}')
            resp['action'] = {
                'id': 'empty_directory',
                'args': [self.from_path],
            }
            self.write(resp)
            return
        if task_worker.performing:
            self.log.info('Already syncing...')
            resp['action'] = {
                'id': 'already_syncing',
                'args': [],
            }
            self.write(resp)
            return
        task_worker.put_task(self.from_path, self.to_path, self.use_rsync)
        resp['action'] = {
            'id': 'started',
            'args': [self.from_path, self.to_path, self.use_rsync],
        }
        self.write(resp)
