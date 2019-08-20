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
import sys
import traceback
import os
from flask import current_app as app
import app_config as cfg
from . import general_functions
GF = general_functions.GeneralFunctions()

bp = Blueprint('notifications', __name__,  url_prefix='/notifications')


@bp.route('/<project_factor>', methods=['GET','POST'])
@is_logged_in
def notifications(project_factor):
    user_info=db.query("""
        select user_id,profile_picture_class
        from system.user where user_id=%s
    """%session['user_id']).dictresult()[0]

    project_id=int(project_factor)/int(cfg.project_factor)
    g=GF.userInfo([{'project_id':project_id},{'project_factor':project_factor}])
    g.project_factor=project_factor
    # g.user_info=json.dumps(user_info)
    # g.profile_picture_class=user_info['profile_picture_class']
    return render_template('notifications.html',g=g)

@bp.route('/getNotifications', methods=['GET','POST'])
@is_logged_in
def getNotifications():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                notifs=db.query("""
                    select
                        notification_id,
                        subject,
                        (select a.profile_picture_class from system.user a where a.user_id=user_from) as user_from_ppc,
                        to_char(sent_date,'DD-MM-YYYY HH24:MI:SS') as sent_date,
                        read
                    from
                        project.notification
                    where
                        project_id=%s
                    and user_to=%s
                    order by sent_date desc limit 10
                """%(data['project_id'],data['user_id'])).dictresult()

                not_list=[]
                if notifs!=[]:
                    for n in notifs:
                        if n['read']==False:
                            notif='<div class="notif unread-notif row container" data-notif="{notification_id}"><img class="{user_from_ppc} notif-img"  alt=""/><a href="#"><span class="notif-subject">{subject}</span><span class="notif-date">{sent_date}</span></a><i class="fa fa-envelope"></i></div>'.format(**n)
                        else:
                            notif='<div class="notif read-notif row container" data-notif="{notification_id}"><img class="{user_from_ppc} notif-img"  alt=""/><a href="#" ><span class="notif-subject">{subject}</span><span class="notif-date">{sent_date}</span></a><i class="fa fa-envelope-open"></i></div>'.format(**n)
                        not_list.append(notif)
                response['success']=True
                response['data']=not_list
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/showNotification', methods=['GET','POST'])
@is_logged_in
def showNotification():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                db.query("""
                    update project.notification
                    set read=True
                    where notification_id=%s
                """%data['notification_id'])
                notif=db.query("""
                    select
                        msg,
                        subject,
                        (select a.name from system.user a where a.user_id=user_from) as user_from,
                        to_char(sent_date, 'DD-MM-YYYY HH24:MI:SS') as sent_date,
                        (select a.profile_picture_class from system.user a where a.user_id=user_from) as ppc,
                        link_content,
                        link_text
                    from
                        project.notification
                    where
                        notification_id=%s
                """%data['notification_id']).dictresult()
                notif[0]['link']=os.path.join(cfg.host,notif[0]['link_content'])
                html='<div class="row notif-content-header"><div class="div-notif-content-img"><img class="{ppc} notif-content-img"  alt=""/></div><div class="div-notif-content-header-text"><p><b>De: </b>{user_from}</p><p><b>Fecha: </b>{sent_date}</p><p><b>Asunto: </b>{subject}</p></div></div><hr style="margin:0;"/><div class="notif-content-msg"><p>{msg}</p><p style="font-weight:bold;"><a href="{link}">{link_text}</a></p></div>'.format(**notif[0])
                response['success']=True
                response['data']=html
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)
