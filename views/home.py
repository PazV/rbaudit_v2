#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g
from wtforms import Form, StringField, TextAreaField, PasswordField, validators
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
from .db_connection import getDB
import logging
db = getDB()
# from .auth import is_logged_in
import json
from flask import current_app as app
# from flask import current_app as app


bp = Blueprint('home', __name__,  url_prefix='/home' )

@bp.route('/')
def home():
    app.logger.info("g home")
    app.logger.info(g)
    app.logger.info(session)
    app.logger.info(session['user_id'])
    user_info=db.query("""
        select profile_picture_class
        from system.user where user_id=%s
    """%session['user_id']).dictresult()[0]['profile_picture_class']

    return render_template('home.html',class_img=user_info)

@bp.route('/notifications')
def notifications():
    return render_template('notifications.html')
