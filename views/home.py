#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g
from wtforms import Form, StringField, TextAreaField, PasswordField, validators
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
from .db_connection import getDB
import logging
db = getDB()
from .login import is_logged_in
import json
from flask import current_app as app
# from flask import current_app as app


bp = Blueprint('home', __name__,  url_prefix='/home' )

@bp.route('/')
@is_logged_in
def home():
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
    g.consultant=user_info['consultant']
    return render_template('home.html',g=g)

@bp.route('/consultant')
@is_logged_in
def consultant():
    #buscar si está en lista de consultores
    is_consultant=db.query("""
        select * from system.consultants
        where user_id=%s
    """%session['user_id']).dictresult()
    if is_consultant!=[]:
        user_info=db.query("""
            select user_id,profile_picture_class,workspace_id
            from system.user where user_id=%s
        """%session['user_id']).dictresult()[0]
        user_info['consultant_workspaces']=is_consultant[0]['workspaces']
        user_info['consultant']=True
        g.user_info=json.dumps(user_info)
        g.profile_picture_class=user_info['profile_picture_class']
        g.notifications=False
        g.consultant=user_info['consultant']
        return render_template('consultant_home.html',g=g)
    else:
        db.query("""
            update system.user_session
            set logged=False,
            finish_session='now'
            where session_id=%s
            and user_id=%s
        """%(session['session_id'],session['user_id']))
        session.clear()
        return redirect(url_for('login.login'))




@bp.route('/notifications')
@is_logged_in
def notifications():
    return render_template('notifications.html')
