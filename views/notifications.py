#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g
from wtforms import Form, StringField, TextAreaField, PasswordField, validators
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
from .db_connection import getDB
db = getDB()
import logging
from .login import is_logged_in
import json
from flask import current_app as app


bp = Blueprint('notifications', __name__,  url_prefix='/notifications' )



@bp.route('/')
@is_logged_in
def notifications():
    user_info=db.query("""
        select user_id,profile_picture_class
        from system.user where user_id=%s
    """%session['user_id']).dictresult()[0]
    g.user_info=json.dumps(user_info)
    g.profile_picture_class=user_info['profile_picture_class']
    return render_template('notifications.html',g=g)
