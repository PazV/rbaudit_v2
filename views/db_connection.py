#-*- coding: utf-8 -*-

from pg import DB

import app_config as cfg

def getDB():
    db=DB(dbname=cfg.postgres['dbname'],user=cfg.postgres['user'],passwd=cfg.postgres['passwd'])
    return db
