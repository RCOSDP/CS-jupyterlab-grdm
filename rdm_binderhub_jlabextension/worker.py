import os
from uuid import uuid4

from tornado import gen
from tornado.queues import Queue
from notebook.base.handlers import log

from tornado.process import Subprocess
from tornado.iostream import PipeIOStream

from .config import ENV_PREFIX


class TaskBase:
    def __init__(self):
        self.id = uuid4()
        self.exit_code = None
        self.stdout = None
        self.stderr = None

    @gen.coroutine
    def perform(self):
        try:
            command = self._generate_command()
            log().info(f'perform command={command}')
            outr, outw = os.pipe()
            errr, errw = os.pipe()
            stdout = PipeIOStream(outr)
            stderr = PipeIOStream(errr)
            try:
                subprocess = Subprocess(command,
                                        stdout=PipeIOStream(outw),
                                        stderr=PipeIOStream(errw))
                self.exit_code = yield subprocess.wait_for_exit(raise_error=False)
            finally:
                self.stdout = yield stdout.read_until_close()
                self.stderr = yield stderr.read_until_close()
        except OSError as e:
            self.exit_code = -1
            self.stdout = None
            self.stderr = str(e).encode('utf8')

    def _generate_command(self):
        raise NotImplementedError()

class RsyncTask(TaskBase):
    def __init__(self, from_path, to_path):
        super().__init__()
        self.from_path = from_path
        self.to_path = to_path

    def _generate_command(self):
        if not os.path.exists(self.to_path):
            os.makedirs(self.to_path)
        raise NotImplementedError()


class CopyTask(TaskBase):
    def __init__(self, from_path, to_path):
        super().__init__()
        self.from_path = from_path
        self.to_path = to_path

    def _generate_command(self):
        if not os.path.exists(self.to_path):
            os.makedirs(self.to_path)
        from_path = os.path.expanduser(self.from_path)
        files = [os.path.join(from_path, filename) for filename in os.listdir(from_path)]
        return ['cp', '-rf'] + files + [os.path.expanduser(self.to_path)]


class TaskWorker(object):
    __instance = None

    def __init__(self):
        self.queue = Queue()
        self.performing = None
        self.performed = None

    @classmethod
    def get_instance(cls):
        if cls.__instance is None:
            cls.__instance = cls()
        return cls.__instance

    @gen.coroutine
    def watch_queue(self):
        log().info('Start watch task queue...')
        while True:
            yield self.execute_queue()

    @gen.coroutine
    def execute_queue(self):
        task = yield self.queue.get()
        log().info('Pop task from queue')
        self.performing = task
        try:
            yield task.perform()
        except:
            log().exception('Error while task error handling: {}'.format(task.id))
        finally:
            self.performing = None
            self.performed = task

    def put_task(self, from_path, to_path, use_rsync=True):
        log().info('Put task to queue')
        task = RsyncTask(from_path, to_path) if use_rsync else CopyTask(from_path, to_path)
        self.queue.put_nowait(task)
