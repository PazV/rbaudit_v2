#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g, send_file
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
import logging
from .login import is_logged_in
import json
import copy
import sys
import traceback
import os
from .db_connection import getDB
db = getDB()
from flask import current_app as app
import app_config as cfg
from . import general_functions
GF = general_functions.GeneralFunctions()

bp = Blueprint('activities', __name__, url_prefix='/activity-list')

@bp.route('/')
# @is_logged_in
def activityList():
    user_info=db.query("""
        select user_id,profile_picture_class,workspace_id
        from system.user where user_id=%s
    """%session['user_id']).dictresult()[0]
    #para saber si es consultor
    is_consultant=db.query("""
        select * from system.consultants
        where user_id=%s
    """%session['user_id']).dictresult()
    if is_consultant==[]:
        user_info['consultant']=False
    else:
        user_info['consultant']=True
    g.user_info=json.dumps(user_info)
    g.profile_picture_class=user_info['profile_picture_class']
    g.notifications=False
    return render_template('activity_list.html',g=g)
