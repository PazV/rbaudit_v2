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

bp = Blueprint('myprojects', __name__, url_prefix='/my-projects')

@bp.route('/')
@is_logged_in
def myProjects():
    user_info=db.query("""
        select user_id,profile_picture_class,workspace_id,name
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
    g.user_name=user_info['name'].decode('utf8')
    return render_template('my_projects.html',g=g)

@bp.route('/consultant')
@is_logged_in
def myProjectsConsultant():
    #buscar si está en lista de consultores
    is_consultant=db.query("""
        select * from system.consultants
        where user_id=%s
    """%session['user_id']).dictresult()
    if is_consultant!=[]:
        user_info=db.query("""
            select user_id,profile_picture_class,workspace_id,name
            from system.user where user_id=%s
        """%session['user_id']).dictresult()[0]
        user_info['consultant_workspaces']=is_consultant[0]['workspaces']
        user_info['consultant']=True
        g.user_info=json.dumps(user_info)
        g.profile_picture_class=user_info['profile_picture_class']
        g.notifications=False
        g.consultant=user_info['consultant']
        g.user_name=user_info['name'].decode('utf8')
        return render_template('my_projects_consultant.html',g=g)
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


@bp.route('/getFirstMenuFolders', methods=['GET','POST'])
@is_logged_in
def getFirstMenuFolders():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                folders=db.query("""
                    select
                        folder_id,
                        name,
                        project_id
                    from
                        project.folder
                    where
                        project_id=%s
                        and parent_id=-1
                    order by folder_id asc
                """%data['project_id']).dictresult()

                if data['mode']=='main':
                    div_class='folder-icon-div'
                    check_class='checkbox-folder-menu'
                else:
                    div_class='folder-icon-div-mod'
                    check_class='checkbox-folder-menu-mod'
                html=''
                for x in folders:
                    html+='<div class="'+div_class+'"><input type="checkbox" class="'+check_class+'" data-document="%s"><div style="display:grid;"><a data-toggle="tooltip" title="%s" class="mp-a-folder"><i class="icon-folder-menu"></i></a><span class="block-with-text" data-toggle="tooltip" title="%s">%s</span></div></div>'%(x['folder_id'],x['name'].decode('utf8'),x['name'].decode('utf8'),x['name'].decode('utf8'))

                response['data']=html


                # response['data']=folders
                response['success']=True
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar validar la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
        app.logger.info(request.form)
        GF.sendErrorMail(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)


@bp.route('/getSubfoldersForms', methods=['GET','POST'])
@is_logged_in
def getSubfoldersForms():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                folders=db.query("""
                    select
                        folder_id,
                        name,
                        project_id
                    from
                        project.folder
                    where
                        project_id=%s
                        and parent_id=%s
                    order by folder_id asc
                """%(data['project_id'],data['folder_id'])).dictresult()

                forms=db.query("""
                    select
                        form_id,
                        name,
                        project_id,
                        status_id
                    from
                        project.form
                    where
                        folder_id=%s
                    and project_id=%s
                    --and status_id > 2
                """%(data['folder_id'],data['project_id'])).dictresult()

                if data['mode']=='main':
                    div_class='folder-icon-div'
                    form_div_class='form-icon-div'
                    check_class='checkbox-folder-menu'
                    check_form_class='checkbox-form-menu'
                else:
                    div_class='folder-icon-div-mod'
                    form_div_class='form-icon-div-mod'
                    check_class='checkbox-folder-menu-mod'
                    check_form_class='checkbox-form-menu-mod'

                html=''
                for x in folders:
                    # html+='<div class="'+div_class+'"><input type="checkbox" class="checkbox-folder-menu" data-document="%s"><div style="display:grid;"><a data-toggle="tooltip" title="%s" class="mp-a-folder"><i class="icon-folder-menu"></i></a><span class="spn-icon-text-mp" data-toggle="tooltip" title="%s">%s</span></div></div>'%(x['folder_id'],x['name'].decode('utf8'),x['name'].decode('utf8'),x['name'].decode('utf8'))

                    html+='<div class="'+div_class+'"><input type="checkbox" class="'+check_class+'" data-document="%s"><div style="display:grid;"><a data-toggle="tooltip" title="%s" class="mp-a-folder"><i class="icon-folder-menu"></i></a><span class="block-with-text" data-toggle="tooltip" title="%s">%s</span></div></div>'%(x['folder_id'],x['name'].decode('utf8'),x['name'].decode('utf8'),x['name'].decode('utf8'))

                for y in forms:
                    if int(y['status_id']) in (1,2):
                        icon_class='icon-form-menu-up'
                        link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(y['project_id'])),'createform','step-2',str(y['form_id']))
                    else:
                        icon_class='icon-form-menu'
                        link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(y['project_id'])),str(y['form_id']))
                    # f['link']='<a href="%s" target="_blank"><i class="fa fa-external-link"></i></a>'%link


                    # html+='<div class="'+div_class+'"><input type="checkbox" class="checkbox-folder-menu" data-document="%s"><div style="display:grid;"><a data-toggle="tooltip" title="%s" class="mp-a-folder" href="%s" target="_blank"><i class="%s"></i></a><span class="spn-icon-text-mp" data-toggle="tooltip" title="%s">%s</span></div></div>'%(y['form_id'],y['name'].decode('utf8'),link,icon_class,y['name'].decode('utf8'),y['name'].decode('utf8'))

                    html+='<div class="'+form_div_class+'"><input type="checkbox" class="'+check_form_class+'" data-document="%s"><div style="display:grid;"><a data-toggle="tooltip" title="%s" class="mp-a-folder" href="%s" target="_blank"><i class="%s"></i></a><span class="block-with-text" data-toggle="tooltip" title="%s">%s</span></div></div>'%(y['form_id'],y['name'].decode('utf8'),link,icon_class,y['name'].decode('utf8'),y['name'].decode('utf8'))

                response['data']=html
                response['success']=True
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar validar la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
        app.logger.info(request.form)
        GF.sendErrorMail(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)


@bp.route('/returnSubFolder', methods=['GET','POST'])
@is_logged_in
def returnSubFolder():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                parent=db.query("""
                    select
                    parent_id from project.folder
                    where folder_id=%s
                    and project_id=%s
                """%(data['parent_id'],data['project_id'])).dictresult()[0]


                folders=db.query("""
                    select
                        folder_id,
                        name,
                        project_id
                    from
                        project.folder
                    where
                        project_id=%s
                        and parent_id=%s
                    order by folder_id asc
                """%(data['project_id'],parent['parent_id'])).dictresult()

                forms=db.query("""
                    select
                        form_id,
                        name,
                        project_id,
                        status_id
                    from
                        project.form
                    where
                        folder_id=%s
                    and project_id=%s
                    --and status_id > 2
                """%(parent['parent_id'],data['project_id'])).dictresult()

                if data['mode']=='main':
                    div_class='folder-icon-div'
                    form_div_class='form-icon-div'
                    check_class='checkbox-folder-menu'
                    check_form_class='checkbox-form-menu'
                else:
                    div_class='folder-icon-div-mod'
                    form_div_class='form-icon-div-mod'
                    check_class='checkbox-folder-menu-mod'
                    check_form_class='checkbox-form-menu-mod'

                html=''
                for x in folders:
                    # html+='<div class="'+div_class+'"><input type="checkbox" class="checkbox-folder-menu" data-document="%s"><div style="display:grid;"><a data-toggle="tooltip" title="%s" class="mp-a-folder"><i class="icon-folder-menu"></i></a><span class="spn-icon-text-mp" data-toggle="tooltip" title="%s">%s</span></div></div>'%(x['folder_id'],x['name'].decode('utf8'),x['name'].decode('utf8'),x['name'].decode('utf8'))

                    html+='<div class="'+div_class+'"><input type="checkbox" class="'+check_class+'" data-document="%s"><div style="display:grid;"><a data-toggle="tooltip" title="%s" class="mp-a-folder"><i class="icon-folder-menu"></i></a><span class="block-with-text" data-toggle="tooltip" title="%s">%s</span></div></div>'%(x['folder_id'],x['name'].decode('utf8'),x['name'].decode('utf8'),x['name'].decode('utf8'))

                for y in forms:
                    if int(y['status_id']) in (1,2):
                        icon_class='icon-form-menu-up'
                        link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(y['project_id'])),'createform','step-2',str(y['form_id']))
                    else:
                        icon_class='icon-form-menu'
                        link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(y['project_id'])),str(y['form_id']))
                    # f['link']='<a href="%s" target="_blank"><i class="fa fa-external-link"></i></a>'%link
                    # html+='<div class="'+div_class+'"><input type="checkbox" class="checkbox-folder-menu" data-document="%s"><div style="display:grid;"><a data-toggle="tooltip" title="%s" class="mp-a-folder" href="%s" target="_blank"><i class="%s"></i></a><span class="spn-icon-text-mp" data-toggle="tooltip" title="%s">%s</span></div></div>'%(y['form_id'],y['name'].decode('utf8'),link,icon_class,y['name'].decode('utf8'),y['name'].decode('utf8'))

                    html+='<div class="'+form_div_class+'"><input type="checkbox" class="'+check_form_class+'" data-document="%s"><div style="display:grid;"><a data-toggle="tooltip" title="%s" class="mp-a-folder" href="%s" target="_blank"><i class="%s"></i></a><span class="block-with-text" data-toggle="tooltip" title="%s">%s</span></div></div>'%(y['form_id'],y['name'].decode('utf8'),link,icon_class,y['name'].decode('utf8'),y['name'].decode('utf8'))

                response['data']=html
                response['success']=True
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar validar la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
        app.logger.info(request.form)
        GF.sendErrorMail(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)
