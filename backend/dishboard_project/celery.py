from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Django設定モジュールを指定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dishboard_project.settings')

# Celeryアプリ作成
app = Celery('dishboard_project')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')