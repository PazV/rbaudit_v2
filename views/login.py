#-*- coding: utf-8 -*-

from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
from .db_connection import getDB
import logging
import sys
import traceback
import json
from flask import current_app as app
from . import general_functions
GF=general_functions.GeneralFunctions()
db = getDB()
import app_config as cfg


bp = Blueprint('login',__name__, url_prefix='/login')
# @auth.route('/login')
# def login():
    # return render_template('prueba.html')
#Check if user logged in


# @auth.route('/')
# @is_logged_in
# def main_view():
#     logging.info("main view")
#     #return render_template(url_for('home'))
#     return render_template('home.html')

@bp.route('/')
def login():
    return render_template('login.html')

@bp.route('/signin', methods=['GET','POST'])
def signin():
    error=''
    try:
        if request.method=='POST':
            email=request.form['email']
            email=email.strip()
            email=email.lower()
            password=request.form['password']
            registered_user=db.query("""
                select *
                from system.user
                where email='%s'
                order by user_id
            """%email).dictresult()
            if registered_user==[]:
                error='Usuario no registrado.'
                flash(u'Usuario no registrado.','user')
            elif registered_user[0]['enabled']=='f':
                error='Usuario deshabilitado.'
                flash(u'Usuario deshabilitado.','user')
            else:
                if not check_password_hash(registered_user[0]['password'],password):
                    error='Contraseña incorrecta.'
                    flash(u'Contraseña incorrecta','pass')
                else:
                    db.query("""
                        update system.user_session
                        set logged=False
                        where user_id=%s
                        and logged=True
                    """%registered_user[0]['user_id'])
                    new_session={
                        'user_id':registered_user[0]['user_id'],
                        'start_session':'now()',
                        'logged':True,
                    }
                    inserted_session=db.insert('system.user_session',new_session)
                    g.session_id=inserted_session['session_id']
                    g.class_img=registered_user[0]['profile_picture_class']
                    session['user_id']=registered_user[0]['user_id']
                    session['session_id']=inserted_session['session_id']
                    session['logged_in']=True
                    return redirect(url_for('home.home'))
        return render_template('login.html')
    except:
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
        return render_template('login.html')


def is_logged_in(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            logged=db.query("""
                select logged from system.user_session
                where session_id=%s
            """%session['session_id']).dictresult()

            if logged!=[]:
                if logged[0]['logged']==True:
                    db.query("""
                        update system.user_session
                        set last_action_at=now()
                        where session_id=%s
                    """%session['session_id'])
                    return f(*args, **kwargs)
                else:
                    flash('Unauthorized, Please login', 'danger')
                    return redirect(url_for('login.login'))
            else:
                flash('Unauthorized, Please login', 'danger')
                return redirect(url_for('login.login'))
        else:
            flash('Unauthorized, Please login', 'danger')
            return redirect(url_for('login.login'))
    return wrap

@bp.route('/signout', methods=['GET','POST'])
@is_logged_in
def signout():
    db.query("""
        update system.user_session
        set logged=False,
        finish_session='now'
        where session_id=%s
        and user_id=%s
    """%(session['session_id'],session['user_id']))
    session.clear()
    return redirect(url_for('login.login'))

@bp.route('/recoverPassword', methods=['GET','POST'])
def recoverPassword():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                exists=db.query("""
                    select user_id from system.user where email='%s' order by user_id limit 1
                """%data['email']).dictresult()
                if exists!=[]:
                    passwd_success,passwd=GF.generateRandomPassword(7)
                    if passwd_success:
                        db.query("""
                            update system.user set password='%s' where user_id=%s
                        """%(generate_password_hash(passwd),exists[0]['user_id']))
                        mail_body='Se ha solicitado una nueva contrase&ntilde;a para el correo <b>%s</b><br><b>Contrase&ntilde;a:</b> %s<br><br><a href="%s">Acceder</a>'%(data['email'],passwd,cfg.host)
                        GF.sendMail('Recuperar contraseña',mail_body,data['email'])
                        response['success']=True
                        response['msg_response']='La contraseña ha sido enviada a su correo.'
                else:
                    response['success']=False
                    response['msg_response']='El correo ingresado no se encuentra registrado.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener los datos.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)
