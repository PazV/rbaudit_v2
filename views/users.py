#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
import logging
import app_config as cfg
import json
from . import general_functions
GF = general_functions.GeneralFunctions()
from flask import current_app as app
import sys
import traceback
import ast
from werkzeug.utils import secure_filename
import os
import copy
from .login import is_logged_in
from .db_connection import getDB
db = getDB()


bp = Blueprint('users', __name__,  url_prefix='/users' )

@bp.route('/saveUser',methods=['GET','POST'])
@is_logged_in
def saveUser():
    response={}
    try:
        if request.method=='POST':
            data=request.form.to_dict()
            user_data=copy.deepcopy(data) #deepcopy significa que los cambios en el nuevo dict no afectarán el dict original
            if str(data['user_id'])=='-1':
                mail_exists=db.query("""
                    select count(*) from system.user
                    where email='%s'
                """%data['email']).dictresult()[0]['count']
                mail_exists=0 #salta validación de correo
                if mail_exists==0:
                    del user_data['user_id']
                    passwd_success,passwd=GF.generateRandomPassword(7)
                    user_data['password']=generate_password_hash(passwd)
                    user_data['created']='now()'
                    user_data['enabled']=True
                    user_data['profile_picture_class']='generic-user-img'
                    new_user=db.insert("system.user",user_data)
                    mail_body='nuevo usuario con el correo: %s, contraseña: %s'%(new_user['email'],passwd)
                    GF.sendMail('Nuevo usuario',mail_body,'pgarcia@russellbedford.mx')
                    response['success']=True
                    response['msg_response']='El usuario ha sido registrado.'

                    if data['file_name']!="false":
                        files=request.files
                        file_path=cfg.profile_img_path
                        file=files[data['file_name']]
                        filename=secure_filename(file.filename)
                        file.save(os.path.join(file_path,filename))
                        fname,ext=os.path.splitext(os.path.join(file_path,filename))
                        os.rename(os.path.join(file_path,filename),os.path.join(file_path,'img_user_%s%s'%(new_user['user_id'],ext)))
                        class_name='profileimage-user-%s-'%new_user['user_id']
                        db.query("""
                            update system.user
                            set profile_picture='%s',
                            profile_picture_class='%s'
                            where user_id=%s
                        """%(os.path.join(file_path,'img_user_%s%s'%(new_user['user_id'],ext)),class_name,new_user['user_id']))
                        css_class=".%s{content:url('%s');}"%(class_name,os.path.join(cfg.class_img_path,'img_user_%s%s'%(new_user['user_id'],ext)))

                        with open(cfg.profile_css_file, "a") as f:
                            # old=f.read()
                            f.write(css_class)

                else:
                    response['success']=False
                    response['msg_response']='Ya existe un usuario registrado con el correo %s.'%data['email']
            else:
                edituser
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error al intentar obtener los datos, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info = sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/getUserTable', methods=['GET','POST'])
@is_logged_in
def getUserTable():
    response={}
    try:
        if request.method=='POST':
            users=db.query("""
                select
                    user_id,
                    name,
                    email,
                    profile_picture_class,
                    'Habilitado' as status
                from
                    system.user
                where
                    enabled=True
                offset %s limit %s
            """%(int(request.form['start']),int(request.form['length']))).dictresult()
            for u in users:
                u['profile_picture']='<img class="%s user-topnavbar-size"  alt=""/>'%u['profile_picture_class']
            users_count=db.query("""
                select count(*)
                from system.user
                where enabled=True
            """).dictresult()
            response['data']=users
            response['recordsTotal']=users_count[0]['count']
            response['recordsFiltered']=users_count[0]['count']
            response['success']=True
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'

    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info= sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/getUserList', methods=['GET','POST'])
@is_logged_in
def getUserList():
    response={}
    try:
        if request.method=='POST':
            users=db.query("""
                select user_id, name
                from system.user
                order by name asc
            """).dictresult()
            response['data']=users
            response['success']=True
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/getAccountInfo', methods=['GET','POST'])
@is_logged_in
def getAccountInfo():
    response={}
    try:
        valid,data=GF.getDict(request.form,'post')
        if valid:
            user=db.query("""
                select user_id, name, email
                from system.user
                where user_id=%s
            """%data['user_id']).dictresult()[0]
            response['data']=user
            response['success']=True
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error al intentar obtener la información, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)
