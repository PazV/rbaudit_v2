#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g, send_file
from wtforms import Form, StringField, TextAreaField, PasswordField, validators
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
import glob
import re
from .db_connection import getDB
db = getDB()
from flask import current_app as app
import app_config as cfg
from . import general_functions
GF = general_functions.GeneralFunctions()
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, Color, colors, PatternFill, Border, Alignment, Side, NamedStyle
from openpyxl.cell import Cell
from time import gmtime, strftime

bp = Blueprint('project', __name__, url_prefix='/project' )

@bp.route('/')
@is_logged_in
def project():
    g=GF.userInfo()
    g.notifications=False
    return render_template('project.html',g=g)

@bp.route('/<project_factor>',methods=['GET','POST'])
@is_logged_in
def goToProject(project_factor):
    project_id=int(project_factor)/int(cfg.project_factor)
    g=GF.userInfo([{'project_id':project_id},{'project_factor':project_factor}])
    g.project_factor=project_factor
    has_notifications=db.query("""
        select count(*) from project.notification
        where project_id=%s and user_to=%s and read=False
    """%(project_id,session['user_id'])).dictresult()[0]
    if has_notifications['count']==0:
        g.notifications=False
    else:
        g.notifications=True
    return render_template('project.html',g=g)

@bp.route('/<project_factor>/<form_id>',methods=['GET','POST'])
@is_logged_in
def resolveForm(project_factor,form_id):
    project_id=int(project_factor)/int(cfg.project_factor)
    g=GF.userInfo([{'project_id':project_id},{'project_factor':project_factor},{'form_id':form_id}])
    g.project_factor=project_factor
    has_notifications=db.query("""
        select count(*) from project.notification
        where project_id=%s and user_to=%s and read=False
    """%(project_id,session['user_id'])).dictresult()[0]
    if has_notifications['count']==0:
        g.notifications=False
    else:
        g.notifications=True
    return render_template('resolve_form.html',g=g)

@bp.route("/<int:project_factor>/createform/step-1", methods=['GET','POST'])
@is_logged_in
def createformStep1(project_factor):
    project_id=int(project_factor)/int(cfg.project_factor)
    g=GF.userInfo([{'project_id':project_id},{'project_factor':project_factor}])
    g.project_factor=project_factor
    has_notifications=db.query("""
        select count(*) from project.notification
        where project_id=%s and user_to=%s and read=False
    """%(project_id,session['user_id'])).dictresult()[0]
    if has_notifications['count']==0:
        g.notifications=False
    else:
        g.notifications=True
    return render_template('createform_step1.html',g=g)

@bp.route("/<int:project_factor>/createform/step-1-import", methods=['GET','POST'])
@is_logged_in
def createformStep1Import(project_factor):
    project_id=int(project_factor)/int(cfg.project_factor)
    g=GF.userInfo([{'project_id':project_id},{'project_factor':project_factor}])
    g.project_factor=project_factor
    has_notifications=db.query("""
        select count(*) from project.notification
        where project_id=%s and user_to=%s and read=False
    """%(project_id,session['user_id'])).dictresult()[0]
    if has_notifications['count']==0:
        g.notifications=False
    else:
        g.notifications=True
    return render_template('createform_step1_import.html',g=g)

@bp.route("/<int:project_factor>/createform/step-2/<int:form>", methods=['GET','POST'])
@is_logged_in
def createformStep2(form,project_factor):
    project_id=int(project_factor)/int(cfg.project_factor)
    g=GF.userInfo([{'form_id':form},{'project_id':project_id},{'project_factor':project_factor}])
    # g.form_id=form
    g.project_factor=project_factor
    has_notifications=db.query("""
        select count(*) from project.notification
        where project_id=%s and user_to=%s and read=False
    """%(project_id,session['user_id'])).dictresult()[0]
    if has_notifications['count']==0:
        g.notifications=False
    else:
        g.notifications=True
    return render_template('createform_step2.html',g=g)

@bp.route("/<int:project_factor>/createform/clone", methods=['GET','POST'])
@is_logged_in
def createformClone(project_factor):
    project_id=int(project_factor)/int(cfg.project_factor)
    g=GF.userInfo([{'project_id':project_id},{'project_factor':project_factor}])
    g.project_factor=project_factor
    has_notifications=db.query("""
        select count(*) from project.notification
        where project_id=%s and user_to=%s and read=False
    """%(project_id,session['user_id'])).dictresult()[0]
    if has_notifications['count']==0:
        g.notifications=False
    else:
        g.notifications=True
    return render_template('clone_form.html',g=g)

@bp.route('/saveProject', methods=['GET','POST'])
@is_logged_in
def saveProject():
    #guardar un proyecto
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'create_projects'})
                if success:
                    if allowed:
                        if data['project_id']==-1:
                            project_info=copy.deepcopy(data)
                            del project_info['project_id']
                            project_info['created']='now'
                            new_project=db.insert('project.project',project_info)
                            user_1={'user_id':project_info['manager'],'project_id':new_project['project_id']}
                            user_2={'user_id':project_info['partner'],'project_id':new_project['project_id']}
                            db.insert('project.project_users',user_1)
                            db.insert('project.project_users',user_2)
                            response['msg_response']='El proyecto ha sido creado.'
                        response['success']=True
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información, favor de intentarlo de nuevo.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'

    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/getProjects', methods=['GET','POST'])
@is_logged_in
def getProjects():
    #obtener los proyectos a los que se encuentra agregado el usuario
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                projects=db.query("""
                    (select a.project_id, a.name, (a.project_id*%d) as project_factor,to_char(a.created,'DD-MM-YYYY HH24:MI:SS') as created
                    from project.project a
                    where a.manager=%s or a.partner=%s
                    union
                    select a.project_id, a.name, (a.project_id*%d) as project_factor,to_char(a.created,'DD-MM-YYYY HH24:MI:SS') as created
                    from project.project a, project.project_users b
                    where a.project_id=b.project_id
                    and b.user_id=%s)
                    order by created desc
                """%(int(cfg.project_factor),data['user_id'],data['user_id'],int(cfg.project_factor),data['user_id'])).dictresult()
                # app.logger.info(projects)
                response['success']=True
                response['data']=projects
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar validar la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)


@bp.route("/saveFormStep1", methods=['GET','POST'])
@is_logged_in
def saveFormStep1():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'create_forms'})
                if success:
                    if allowed:
                        if data['form_id']==-1: #formulario nuevo
                            form_info=copy.deepcopy(data)
                            del form_info['form_id']
                            form_info['created_by']=form_info['user_id']
                            form_info['create_date']='now()'
                            form_info['status_id']=1
                            form_info['published']=False
                            form_info['user_last_update']=form_info['user_id']
                            columns_info=form_info['columns_info']
                            columns=[]
                            dict_len=len(columns_info)/2
                            for x in range (1,dict_len+1):
                                column={}
                                column['order']=x
                                column['name']=columns_info['col_%s'%x]
                                column['editable']=columns_info['checkcol_%s'%x]
                                columns.append(column)
                            form_info['columns']=str(columns)

                            new_form=db.insert('project.form',form_info)
                            response['success']=True
                            response['form_id']=new_form['form_id']
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'

            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener los datos, favor de intentarlo de nuevo.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentar de nuevo más tarde.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route("/<path:subpath>/getUnpublishedForms", methods=['GET','POST'])
@is_logged_in
def getUnpublishedForms(subpath):
    #mostrar formularios que están pendientes por publicar
    #no requiere validación de usuario
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                forms=db.query("""
                    select
                        form_id, name
                    from
                        project.form
                    where
                        project_id=%s
                        and status_id in (1,2)
                        order by create_date desc
                """%data['project_id']).dictresult()
                response['data']=forms
                response['success']=True
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener los datos, favor de intentarlo de nuevo.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/saveFolder', methods=['GET','POST'])
@is_logged_in
def saveFolder():
    #Guardar nueva carpeta
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'create_folders'})
                if success:
                    if allowed:
                        if data['mode']=='new':
                            db.insert('project.folder',data)
                            response['msg_response']='La carpeta ha sido agregada.'
                        else:
                            db.query("""
                                update project.folder
                                set name='%s' where folder_id=%s
                            """%(data['name'],data['folder_id']))
                            response['msg_response']='La carpeta ha sido actualizada.'
                        response['success']=True
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información, favor de intentarlo de nuevo.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/getMenu',methods=['GET','POST'])
@is_logged_in
def getMenu():
    #obtener el menú de carpetas
    #no requiere validar permisos
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                folders=db.query("""
                    select folder_id, name from project.folder
                    where project_id=%s and parent_id=-1 order by folder_id
                """%data['project_id']).dictresult()

                final_html=""
                if folders!=[]:
                    for f in folders:
                        fh_node='<input type="checkbox" class="form-check-input tree-menu-checkbox folder-checkbox"><li class="selectable-folder"><a href="#" data-folder="%s">%s</a><ul>'%(f['folder_id'],f['name'])
                        sh_node='</ul></li>'
                        res_html=getMenuNodes(f['folder_id'],fh_node,sh_node,data['project_id'])
                        final_html+=res_html
                response['success']=True
                response['menu']='<ul class="file-tree">%s</ul>'%final_html
                # app.logger.info(response['menu'])

            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener los datos, favor de intentarlo de nuevo.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'

    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)


def getMenuNodes(folder_id, fh_html,sh_html,project_id):
    #obtiene los nodos del menú
    #no requiere validar permisos
    try:
        folders=db.query("""
            select folder_id, name
            from project.folder
            where parent_id=%s order by folder_id
        """%folder_id).dictresult()
        forms=db.query("""
            select
                form_id, name
            from project.form where project_id=%s and folder_id=%s
            and status_id>2 order by name
        """%(project_id,folder_id)).dictresult()

        node=""

        if folders==[]:
            if forms==[]:
                return fh_html+sh_html
            else:

                forms_str=""
                for f in forms:
                    project_factor=int(project_id)*int(cfg.project_factor)
                    url='/project/%s/%s'%(project_factor,f['form_id'])
                    forms_str+='<input type="checkbox" class="form-check-input tree-menu-checkbox form-checkbox"><li class="selectable-form"><a href="%s" id="%s">%s</a></li>'%(url,f['form_id'],f['name'])
                return fh_html+forms_str+sh_html
        else:
            forms_str=""
            if forms!=[]:
                for f in forms:
                    project_factor=int(project_id)*int(cfg.project_factor)
                    url='/project/%s/%s'%(project_factor,f['form_id'])
                    forms_str+='<input type="checkbox" class="form-check-input tree-menu-checkbox form-checkbox"><li class="selectable-form"><a href="%s" id="%s">%s</a></li>'%(url,f['form_id'],f['name'])
            current_level=""
            for x in folders:
                fh_new_node='<input type="checkbox" class="form-check-input tree-menu-checkbox folder-checkbox"><li class="selectable-folder"><a href="#" data-folder="%s">%s</a><ul>'%(x['folder_id'],x['name'])
                sh_new_node='</ul></li>'
                res_node=getMenuNodes(x['folder_id'],fh_new_node,sh_new_node,project_id)
                current_level+=res_node

            return fh_html+forms_str+current_level+sh_html
    except:
        app.logger.info(traceback.format_exc(sys.exc_info()))

@bp.route('/deleteFolder', methods=['GET','POST'])
@is_logged_in
def deleteFolder():
    #eliminar carpetas del menú
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'create_folders'})
                if success:
                    if allowed:
                        funcion
                        #función para validar si la carpeta tiene subcarpetas o archivos
                        # db.query("""
                        #     select count(*) from
                        # """)
                        response['success']=True
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener los datos, favor de intentarlo de nuevo.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)


@bp.route('/createFormTable', methods=['GET','POST'])
@is_logged_in
def createFormTable():
    #obtiene la tabla del formulario para su configuración
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'create_forms'})
                if success:
                    if allowed:
                        page=(int(data['page'])*10)-10
                        form_info=db.query("""
                            select a.form_id,a.project_id,a.columns_number, a.rows, a.columns,a.name,
                            to_char(a.last_updated, 'DD-MM-YYYY HH24:MI:SS') as last_updated,
                            (select u.name from system.user u where u.user_id=a.user_last_update) as user_last_update, b.status
                            from project.form_status b, project.form a
                            where a.form_id=%s
                            and a.status_id=b.status_id
                        """%data['form_id']).dictresult()
                        columns=eval(form_info[0]['columns'])
                        #check if table exists
                        table_name='project_%s_form_%s'%(form_info[0]['project_id'],form_info[0]['form_id'])
                        exists=db.query("""
                            select exists(select 1 from information_schema.tables where table_schema='form' and table_name='%s')
                        """%table_name).dictresult()

                        if exists[0]['exists']==False: #create table

                            columns_str=""
                            for x in columns:
                                columns_str+=" ,col_%s text default ''"%x['order']
                            db.query("""
                                CREATE TABLE form.%s(
                                    entry_id serial not null primary key,
                                    form_id integer not null,
                                    project_id integer not null
                                    %s
                                );
                            """%(table_name,columns_str))
                            for i in range(0,int(form_info[0]['rows'])):
                                db.insert('form.%s'%table_name,{'form_id':form_info[0]['form_id'],'project_id':form_info[0]['project_id']})

                        table_str='<table class="table table-bordered table-responsive-md table-striped text-center" id="grdPrefilledForm"><thead><tr>'
                        for c in columns:
                            table_str+='<th class="text-center">%s</th>'%c['name']
                        table_str+='</tr></thead><tbody>'

                        table_info=db.query("""
                            select * from form.%s order by entry_id
                            offset %s limit 10
                        """%(table_name,page)).dictresult()


                        for t in table_info:
                            keys=sorted(t.iteritems())
                            table_str+='<tr>'
                            for k in keys:
                                if k[0].split('_')[0]=='col':
                                    table_str+='<td class="pt-3-half" contenteditable="true" name="%s" data-entry="%s">%s</td>'%(k[0],t['entry_id'],k[1].decode('utf8'))
                                else:
                                    table_str+='</tr>'
                                    break
                        table_str+='</tbody></table>'

                        if int(form_info[0]['rows'])%10!=0:
                            num_buttons=int(int(form_info[0]['rows'])/10)+1
                        else:
                            num_buttons=int(int(form_info[0]['rows'])/10)
                        buttons='<div class="btn-group btn-group-sm" role="group"><input class="paging-toolbar-number" type="text" readonly id="paging_toolbar_number"/>'
                        for b in range (0,num_buttons):
                            buttons+='<button type="button" class="btn btn-secondary form-paging-toolbar" data-number="%s">%s</button>'%(int(b+1),int(b+1))
                        buttons+='</div>'

                        response['form_name']=form_info[0]['name']
                        response['success']=True
                        response['html']=table_str
                        response['paging_toolbar']=buttons
                        response['status']="(%s)"%form_info[0]['status']
                        response['last_updated']='Actualizado %s por %s'%(form_info[0]['last_updated'],form_info[0]['user_last_update'])
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error la intentar obtener la información, favor de intentarlo de nuevo.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)


@bp.route('/savePrefilledForm', methods=['GET','POST'])
@is_logged_in
def savePrefilledForm():
    #guardar información al llenar los datos de configuración de la tabla del formulario
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'create_forms'})
                if success:
                    if allowed:
                        # app.logger.info(data)
                        for x in data['table_data']:
                            # app.logger.info(x)
                            update_list=[]
                            for key,value in x.iteritems():
                                if key.split("_")[0]=='col':
                                    update_list.append("%s='%s'"%(key,value))
                            update_str=','.join(e for e in update_list)
                            query="""
                                update form.project_%s_form_%s set %s where entry_id=%s
                            """%(data['project_id'],data['form_id'],update_str,x['entry_id'])
                            # app.logger.info(query)
                            db.query(query)

                        db.query("""
                            update project.form set status_id=2, user_last_update=%s, last_updated='now' where form_id=%s and project_id=%s
                        """%(data['user_id'],data['form_id'],data['project_id']))

                        response['success']=True
                        response['msg_response']='Los cambios han sido guardados.'
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo más tarde.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/getFormRevisionUsers', methods=['GET','POST'])
@is_logged_in
def getFormRevisionUsers():
    #carga los usuarios a seleccionar para ser revisores
    #no requiere validar permisos
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                users=db.query("""
                    select
                        a.user_id,
                        a.name
                    from
                        system.user a,
                        project.project_users b
                    where
                        a.user_id=b.user_id
                    and b.project_id=%s
                    order by a.name
                """%data['project_id']).dictresult()
                response['data']=users
                response['success']=True
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

@bp.route('/publishForm', methods=['GET','POST'])
@is_logged_in
def publishForm():
    #publicar un formulario para que sea resuelto por alguien
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'create_forms'})
                if success:
                    if allowed:
                        revisions=[]
                        for k,v in data.iteritems():
                            if k.split('_')[0]=='revision':
                                rev={
                                    'form_id':data['form_id'],
                                    'user_id':v,
                                    'revision_number':k.split("_")[1]
                                }
                                db.insert("project.form_revisions",rev)
                                revisions.append('%s:%s'%(k,v))
                        str_revisions=','.join(e for e in revisions)

                        db.query("""
                            update project.form
                            set status_id=3,
                            notify_assignee=%s,
                            notify_resolved=%s,
                            resolve_before='%s',
                            assigned_to=%s,
                            revisions='%s'
                            where form_id=%s
                            and project_id=%s
                        """%(data['notify_assignee'],data['notify_resolved'],data['resolve_date'],data['assigned_to'],str_revisions,data['form_id'],data['project_id']))
                        table_name='form.project_%s_form_%s'%(data['project_id'],data['form_id'])
                        db.query("""
                            alter table %s add rev_1 text default ''
                        """%table_name)
                        notif_info={'project_id':data['project_id'],'form_id':data['form_id']}
                        # GF.createNotification('publish_form',data['project_id'],data['form_id'])
                        GF.createNotification('publish_form',notif_info)
                        response['success']=True
                        response['msg_response']='El formulario ha sido publicado, puede encontrarlo en el menú del lado izquierdo.'
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
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

@bp.route('/getFormToResolve', methods=['GET','POST'])
@is_logged_in
def getFormToResolve():
    #obtiene la tabla para resolverla
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'resolve_forms'})
                if success:
                    if allowed:
                        page=(int(data['page'])*10)-10
                        form_info=db.query("""
                            select a.form_id,a.project_id,a.columns_number, a.rows, a.columns, a.name, a.assigned_to, a.status_id,
                            to_char(a.last_updated, 'DD-MM-YYYY HH24:MI:SS') as last_updated,
                            (select u.name from system.user u where u.user_id=a.user_last_update) as user_last_update, b.status
                            from  project.form_status b, project.form a
                            where a.form_id=%s
                            and a.status_id=b.status_id
                        """%data['form_id']).dictresult()
                        columns=eval(form_info[0]['columns'])

                        #check if table exists
                        table_name='project_%s_form_%s'%(form_info[0]['project_id'],form_info[0]['form_id'])

                        table_str='<table class="table table-bordered table-responsive-md table-striped text-center table-ns" id="grdFormToResolve"><thead><tr>'
                        editables=[]
                        for c in columns:
                            table_str+='<th class="text-center">%s</th>'%c['name']
                            if c['editable']==True:
                                editables.append('col_%s'%c['order'])
                        rev='Revisión'.decode('utf8')
                        table_str+='<th class="text-center">%s</th>'%rev
                        table_str+='</tr></thead><tbody>'

                        table_info=db.query("""
                            select * from form.%s order by entry_id
                            offset %s limit 10
                        """%(table_name,page)).dictresult()

                        if form_info[0]['status_id']==7:
                            for t in table_info:
                                keys=sorted(t.iteritems())
                                table_str+='<tr>'
                                for k in keys:
                                    if k[0].split('_')[0]=='col':
                                        table_str+='<td class="pt-3-half" contenteditable="false" name="%s" data-entry="%s">%s</td>'%(k[0],t['entry_id'],k[1].decode('utf8'))
                                    else:
                                        table_str+='<td class="pt-3-half" contenteditable="false" name="rev_1" data-entry="%s">%s</td>'%(t['entry_id'],t['rev_1'].decode('utf8'))
                                        table_str+='</tr>'
                                        break
                        else:
                            rev_editable=True #columna de revisión es editable
                            if int(data['user_id'])==form_info[0]['assigned_to']: #en caso de que el usuario que va a ver el formulario sea a quien fue asignado
                                rev_editable=False #no se permite editar columna de revisión
                            for t in table_info:
                                keys=sorted(t.iteritems())
                                table_str+='<tr>'
                                for k in keys:
                                    if k[0].split('_')[0]=='col':
                                        if k[0] in editables:
                                            table_str+='<td class="pt-3-half" contenteditable="true" name="%s" data-entry="%s">%s</td>'%(k[0],t['entry_id'],k[1].decode('utf8'))
                                        else:
                                            table_str+='<td class="pt-3-half" contenteditable="false" name="%s" data-entry="%s">%s</td>'%(k[0],t['entry_id'],k[1].decode('utf8'))
                                    else:
                                        if rev_editable==True:
                                            table_str+='<td class="pt-3-half" contenteditable="true" name="rev_1" data-entry="%s">%s</td>'%(t['entry_id'],t['rev_1'].decode('utf8'))
                                        else:
                                            table_str+='<td class="pt-3-half" contenteditable="false" name="rev_1" data-entry="%s">%s</td>'%(t['entry_id'],t['rev_1'].decode('utf8'))
                                        table_str+='</tr>'
                                        break
                        table_str+='</tbody></table>'

                        if int(form_info[0]['rows'])%10!=0:
                            num_buttons=int(int(form_info[0]['rows'])/10)+1
                        else:
                            num_buttons=int(int(form_info[0]['rows'])/10)
                        buttons='<div class="btn-group btn-group-sm" role="group"><input class="paging-toolbar-number" type="text" readonly id="paging_toolbar_numberTR"/>'
                        for b in range (0,num_buttons):
                            buttons+='<button type="button" class="btn btn-secondary form-paging-toolbar" data-number="%s">%s</button>'%(int(b+1),int(b+1))
                        buttons+='</div>'
                        response['form_name']=form_info[0]['name']
                        response['success']=True
                        response['html']=table_str
                        response['paging_toolbar']=buttons
                        response['status']="(%s)"%form_info[0]['status']
                        response['last_updated']='Actualizado %s por %s'%(form_info[0]['last_updated'],form_info[0]['user_last_update'])
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
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

@bp.route('/checkUserIsAllowed',methods=['GET','POST'])
@is_logged_in
def checkUserIsAllowed():
    #revisa si el usuario tiene permitido ver formulario para resolverlo
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'resolve_forms'})
                if success:
                    if allowed:
                        allowed_users=db.query("""
                            select
                                f.assigned_to,
                                --f.revisions,
                                p.manager,
                                p.partner,
                                p.project_id,
                                f.status_id
                            from
                                project.project p,
                                project.form f
                            where
                                f.form_id=%s
                            and f.project_id=p.project_id
                        """%data['form_id']).dictresult()[0]

                        revisions=db.query("""
                            select user_id from project.form_revisions where form_id=%s
                        """%data['form_id']).dictresult()

                        match=False
                        readonly=False
                        if int(allowed_users['partner'])==int(data['user_id']) or int(allowed_users['manager'])==int(data['user_id']): #si es socio o gerente del proyecto, tiene acceso a editar y/o ver formularios en todo momento
                            match=True
                            readonly=False
                        else:
                            if int(allowed_users['status_id'])<5: #si está en proceso de llenado o configuración del formulario
                                for k,v in allowed_users.iteritems():
                                    if v!='project_id' or v!='status_id': #verifica si es socio, gerente o tiene asignado el formulario
                                        if int(v)==int(data['user_id']):
                                            match=True #si tiene asignado el formulario, tiene permisos para verlo
                                            break
                                if match==False:
                                    for r in revisions:
                                        if int(r['user_id'])==int(data['user_id']):
                                            match=True
                                            break
                                    if match==False: #si no se encuentra entre los usuarios del formulario
                                        #se busca si el usuario tiene permisos para ver todos los formularios
                                        allowed_seeing=db.query("""
                                            select see_all_forms
                                            from system.user where user_id=%s
                                        """%data['user_id']).dictresult()
                                        if allowed_seeing[0]['see_all_forms']==True:
                                            match=True #si tiene permiso, se le permite verlo
                                            readonly=True #pero no puede editarlo


                                    # if k=='revisions':
                                    #     revision_list=v.split(",")
                                    #     for r in revision_list:
                                    #         if int(r.split(":")[1])==int(data['user_id']):
                                    #             match=True #si es revisor, tiene permiso de ver el formulario y editarlo
                                    #             break
                                    #         break
                                    # else:
                                    #     if v!='project_id' or v!='status_id':
                                    #         if int(v)==int(data['user_id']):
                                    #             match=True #si tiene asignado el formulario, tiene permisos para verlo
                                    #             break

                            else: #si se encuentra en la etapa de revisión
                                if int(data['user_id'])==int(allowed_users['assigned_to']): #si es el usuario a quien fue asignado el formulario
                                    match=True #puede verlo
                                    readonly=True #no puede editarlo
                                else: #se busca si está entre los revisores
                                    for r in revisions:
                                        if int(r['user_id'])==int(data['user_id']):
                                            match=True #si está entre los revisores, puede verlo
                                            readonly=False #y puede editarlo
                                    # rev_list=allowed_users['revisions'].split(",") #se busca si está entre los revisores
                                    # app.logger.info(rev_list)
                                    # for r in rev_list:
                                    #     if int(r.split(":")[1])==int(data['user_id']):
                                    #         match=True #si está entre los revisores, puede verlo
                                    #         readonly=False #y puede editarlo
                                    #         break
                                    if match==False: #si no se encuentra entre los usuarios del formulario
                                        #se busca si el usuario tiene permisos para ver todos los formularios
                                        allowed_seeing=db.query("""
                                            select see_all_forms from system.user
                                            where user_id=%s
                                        """%data['user_id']).dictresult()[0]
                                        if allowed_seeing['see_all_forms']==True:
                                            match=True #si tiene permisos, se permite ver el formulario
                                            readonly=True #pero no puede editarlo

                        response['match']=match
                        response['success']=True
                        response['readonly']=readonly
                        if match==False:
                            response['msg_response']='Usted no tiene permisos para acceder a este formulario.'
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'

            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información, favor de intentarlo de nuevo.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/getFormDetails', methods=['GET','POST'])
@is_logged_in
def getFormDetails():
    #muestra los detalles del formulario
    #no requiere validar permisos
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                info=db.query("""
                    select
                        (select a.name from system.user a where a.user_id=f.assigned_to) as assigned_to,
                        --f.revisions,
                        to_char(f.create_date,'DD-MM-YYYY HH24:MI:SS') as create_date,
                        (select a.name from system.user a where a.user_id=f.created_by) as created_by,
                        to_char(f.resolve_before,'DD-MM-YYYY HH24:MI:SS') as resolve_before,
                        (select c.status from project.form_status c where c.status_id=f.status_id) as status
                    from
                        project.form f
                    where
                        f.form_id=%s
                """%data['form_id']).dictresult()[0]

                html='<p><b>Asignado a: </b>%s<br><b>Resolver antes de: </b>%s<br>'%(info['assigned_to'].decode('utf-8'),info['resolve_before'])

                revisions=db.query("""
                    select b.user_id,
                    (select a.name from system.user a where a.user_id=b.user_id) as user_name,
                    b.revision_number
                    from project.form_revisions b
                    where b.form_id=%s order by b.revision_number asc
                """%data['form_id']).dictresult()
                for r in revisions:
                    rev='Revisión %s'%(r['revision_number'])
                    html+='<b>%s: </b>%s<br>'%(rev.decode('utf-8'),r['user_name'].decode('utf-8'))
                # rev_list=info['revisions'].split(',')
                # for r in rev_list:
                #     rev='Revisión %s'%((r.split(":")[0]).split("_")[1])
                #     user_rev=db.query("""
                #         select name from system.user where user_id=%s
                #     """%r.split(":")[1]).dictresult()[0]
                #     html+='<b>%s: </b>%s<br>'%(rev.decode('utf-8'),user_rev['name'].decode('utf-8'))

                html+='<b>Creado: </b>%s<br>'%info['create_date']
                html+='<b>Creado por: </b>%s<br>'%info['created_by'].decode('utf-8')
                html+='<b>Estado actual: </b>%s</p>'%info['status'].decode('utf-8')

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

@bp.route('/saveResolvingForm', methods=['GET','POST'])
@is_logged_in
def saveResolvingForm():
    #guardar datos al ir resolviendo el formulario
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'resolve_forms'})
                if success:
                    if allowed:
                        for x in data['table_data']:
                            update_list=[]
                            for key,value in x.iteritems():
                                if key.split("_")[0]=='col' or key.split("_")[0]=='rev':                                
                                    update_list.append("%s=$$%s$$"%(key,value))
                            update_str=','.join(e for e in update_list)
                            query="""
                                update form.project_%s_form_%s set %s where entry_id=%s
                            """%(data['project_id'],data['form_id'],update_str,x['entry_id'])
                            # app.logger.info(query)
                            db.query(query)

                        db.query("""
                            update project.form set status_id=4, user_last_update=%s, last_updated='now' where form_id=%s and project_id=%s
                        """%(data['user_id'],data['form_id'],data['project_id']))

                        response['success']=True
                        response['msg_response']='Los cambios han sido guardados.'
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
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

@bp.route('/sendFormToRevision', methods=['GET','POST'])
@is_logged_in
def sendFormToRevision():
    #enviar formulario a revisión
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'resolve_forms'})
                if success:
                    if allowed:
                        db.query("""
                            update project.form
                            set
                                status_id=5,
                                user_last_update=%s,
                                last_updated='now',
                                resolved_date='now'
                            where
                                form_id=%s
                            and project_id=%s
                        """%(data['user_id'],data['form_id'],data['project_id']))
                        db.query("""
                            update project.form_revisions set currently_assigned=True
                            where form_id=%s and revision_number=1
                        """%data['form_id'])
                        notif_info={'project_id':data['project_id'],'form_id':data['form_id']}
                        # GF.createNotification('send_to_revision1',data['project_id'],data['form_id'])
                        GF.createNotification('send_to_revision1',notif_info)
                        response['success']=True
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
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

@bp.route('/<path:subpath>/getFormsToCheck', methods=['GET','POST'])
@is_logged_in
def getFormsToCheck(subpath):
    #obtiene los formularios que se encuentran pendientes por revisar
    #no requiere validar permisos
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                forms=db.query("""
                    select
                        form_id, name, revisions
                    from
                        project.form
                    where
                        project_id=%s
                        and status_id in (5,6)
                        order by create_date desc
                """%data['project_id']).dictresult()
                managers=db.query("""
                    select manager,partner
                    from project.project
                    where project_id=%s
                """%data['project_id']).dictresult()[0]
                response['success']=True
                if int(managers['manager'])==int(data['user_id']) or int(managers['partner'])==int(data['user_id']):
                    response['data']=forms
                else:
                    showing_forms=[]
                    for f in forms:
                        # revs=f['revisions'].split(",")
                        revisions=db.query("""
                            select user_id from project.form_revisions where form_id=%s
                        """%f['form_id']).dictresult()
                        # for r in revs:
                        #     if int(r.split(":")[1])==int(data['user_id']):
                        #         showing_forms.append(f)
                        #         break
                        for r in revisions:
                            if int(r['user_id'])==int(data['user_id']):
                                showing_forms.append(f)
                                break
                    response['data']=showing_forms

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

@bp.route('/checkToDoRevision', methods=['GET','POST'])
@is_logged_in
def checkToDoRevision():
    #revisa si tiene permiso para revisar el formulario
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'resolve_forms'})
                if success:
                    if allowed:
                        form=db.query("""
                            select
                                status_id
                                --, revisions
                            from
                                project.form
                            where form_id=%s
                        """%(data['form_id'])).dictresult()
                        response['success']=True
                        if form[0]['status_id'] in (5,6): #revisa el status del formulario para ver si puede ser revisado
                            users=db.query("""
                                select manager, partner
                                from project.project
                                where project_id=%s
                            """%data['project_id']).dictresult()[0]
                            if int(data['user_id'])==int(users['manager']) or int(data['user_id'])==int(users['partner']): #verifica si el usuario es el gerente o socio del proyecto
                                response['allowed']=True
                            else:
                                revisions=db.query("""
                                    select user_id from project.form_revisions where form_id=%s
                                    and currently_assigned=True
                                """%data['form_id']).dictresult()[0]
                                # rev_list=form[0]['revisions'].split(",")
                                # app.logger.info("rev_list")
                                # app.logger.info(rev_list)
                                # for r in rev_list: #verifica si el usuario es alguno de los revisores
                                # for r in revisions: #verifica si el usuario es alguno de los revisores
                                #     # if int(data['user_id'])==int(r.split(":")[1]):
                                #     if int(data['user_id'])==int(r['user_id']):
                                #         app.logger.info("allowed")
                                #         response['allowed']=True
                                #         break
                                if int(revisions['user_id'])==int(data['user_id']):
                                    response['allowed']=True
                                if 'allowed' not in response:
                                    response['allowed']=False
                                    response['msg_response']='Usted no tiene permisos para revisar este formulario.'
                        else:
                            response['msg_response']='El formulario no se encuentra disponible para ser revisado.'
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener los datos, favor de intentarlo de nuevo.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/checkAddComment', methods=['GET','POST'])
@is_logged_in
def checkAddComment():
    #verificar si tiene permisos para agregar comentarios al formulario
    #no requiere validación de permisos
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:

                # form_info=db.query("""
                #     select project_id
                #     from project.form
                #     where form_id=%s
                # """%data['form_id']).dictresult()[0]
                user_list=[]
                # revs=form_info['revisions'].split(",")
                revisions=db.query("""
                    select user_id from project.form_revisions where form_id=%s
                """%data['form_id']).dictresult()
                # for r in revs:
                #     user_list.append(int(r.split(":")[1]))
                for r in revisions:
                    user_list.append(int(r['user_id']))
                managers=db.query("""
                    select a.manager,a.partner from project.project a, project.form b
                    where a.project_id=b.project_id and b.form_id=%s
                """%data['form_id']).dictresult()[0]
                user_list.append(int(managers['manager']))
                user_list.append(int(managers['partner']))
                if int(data['user_id']) in user_list:
                    response['access']=True
                else:
                    response['access']=False
                    response['msg_response']='No tienes permisos para agregar comentarios a este formulario.'
                response['success']=True
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo más tarde.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/addFormComment', methods=['GET','POST'])
@is_logged_in
def addFormComment():
    #agregar un comentario al formulario
    #no requiere validación de permisos
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                comment={
                    'comment':data['comment'].encode('utf-8'),
                    'user_id':data['user_id'],
                    'form_id':data['form_id'],
                    'created':'now'
                }
                db.insert('project.form_comments',comment)
                response['success']=True
                response['msg_response']='El comentario ha sido agregado.'

            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/getFormComments', methods=['GET','POST'])
@is_logged_in
def getFormComments():
    #ver los comentarios que han sido agregados al formulario
    #no requiere validación de permisos
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                comments=db.query("""
                    select
                        to_char(b.created, 'DD-MM-YYYY HH24:MI:SS') as created,
                        b.comment,
                        (select a.name from system.user a where a.user_id=b.user_id) as user
                    from
                        project.form_comments b
                    where
                        b.form_id=%s
                    order by created desc
                """%data['form_id']).dictresult()

                if comments!=[]:
                    for c in comments:
                        c['author']='Agregado por {user} el {created}.'.format(**c)
                response['data']=comments
                response['success']=True
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/checkSendToRevision', methods=['GET','POST'])
@is_logged_in
def checkSendToRevision():
    #revisar si tiene permisos para enviar a revisión un formulario
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'resolve_forms'})
                if success:
                    if allowed:
                        check=db.query("""
                            select assigned_to,status_id from project.form
                            where form_id=%s
                        """%data['form_id']).dictresult()[0]
                        if check['status_id']==3:
                            if int(check['assigned_to'])==int(data['user_id']):
                                response['allowed']=True
                            else:
                                response['allowed']=False
                                response['msg_response']='No tienes permiso para enviar a revisión este formulario.'
                        else:
                            response['allowed']=False
                            response['msg_response']='Este formulario no puede ser enviado a revisión'
                        response['success']=True
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/importNewForm',methods=['GET','POST'])
@is_logged_in
def importNewForm():
    #crear un nuevo formulario a partir de un archivo de excel
    response={}
    try:
        data=request.form.to_dict()
        success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'create_forms'})
        if success:
            if allowed:
                files=request.files
                file_path=cfg.uploaded_forms_files_path
                file=files[data['file_name']]
                filename = secure_filename(file.filename)
                file.save(os.path.join(file_path, filename))
                read_file=load_workbook(os.path.join(file_path,filename))
                ws=read_file['Sheet1']

                form={
                    'project_id':data['project_id'],
                    'name':data['name'],
                    'columns_number':int(ws.max_column),
                    'rows':int(ws.max_row),
                    'created_by':int(data['user_id']),
                    'create_date':'now',
                    'folder_id':int(data['folder_id']),
                    'status_id':2,
                    'user_last_update':int(data['user_id']),
                    'last_updated':'now'
                }

                columns=[]
                for x in range(1,int(ws.max_column)+1):
                    column={
                        'order':x,
                        'name':ws.cell(row=1, column=x).value
                    }
                    if ws.cell(row=2, column=x).value is None:
                        column['editable']=True
                    else:
                        column['editable']=False
                    columns.append(column)
                form['columns']=str(columns)
                db.insert('project.form',form)

                table_name='project_%s_form_%s'%(form['project_id'],form['form_id'])


                columns_str=""
                for c in columns:
                    columns_str+=" ,col_%s text default ''"%c['order']
                db.query("""
                    CREATE TABLE form.%s(
                        entry_id serial not null primary key,
                        form_id integer not null,
                        project_id integer not null
                        %s
                    );
                """%(table_name,columns_str))

                for i in range(0,int(form['rows'])-1):
                    ins={
                        'form_id':form['form_id'],
                        'project_id':form['project_id']
                    }
                    for c in columns:
                        if c['editable']==False:
                            if ws.cell(row=i+2, column=c['order']).value is not None:
                                ins['col_%s'%c['order']]=(ws.cell(row=i+2, column=c['order']).value).encode('utf-8')
                            else:
                                ins['col_%s'%c['order']]=''
                    db.insert('form.%s'%table_name,ins)
                response['success']=True
                response['msg_response']='El formulario ha sido agregado.'
            else:
                response['success']=False
                response['msg_response']='No tienes permisos para realizar esta acción.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error al intentar validar la información.'

    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/checkAllowedDownload', methods=['GET','POST'])
@is_logged_in
def checkAllowedDownload():
    #revisa si tiene permisos para descargar el formulario
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'download_forms'})
                if success:
                    if allowed:
                        status=db.query("""
                            select status_id from project.form where form_id=%s
                        """%data['form_id']).dictresult()
                        #debe ser el último status
                        if int(status[0]['status_id'])==7:
                            manager=db.query("""
                                select * from project.project where project_id=%s and (manager=%s or partner=%s)
                            """%(data['project_id'],data['user_id'],data['user_id'])).dictresult()
                            if manager!=[]:
                                response['allowed']=True
                            else:
                                users=db.query("""
                                    select a.* from project.project_users a, system.user b where
                                    b.download_forms=True and a.user_id=b.user_id and a.project_id=%s and a.user_id=%s
                                """%(data['project_id'],data['user_id'])).dictresult()
                                if users!=[]:
                                    response['allowed']=True
                                else:
                                    response['allowed']=False
                                    response['msg_response']='No tienes permisos para descargar este formulario.'
                        else:
                            response['allowed']=False
                            response['msg_response']='Este formulario no puede ser descargado aún.'
                        response['success']=True
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/doDownloadResolvedForm', methods=['GET','POST'])
@is_logged_in
def downloadResolvedForm():
    #crear archivo de excel de formulario resuelto para su descarga
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'download_forms'})
                if success:
                    if allowed:
                        project=db.query("""
                            select
                                name,
                                company_name,
                                (select a.name from system.user a where a.user_id=manager) as manager,
                                (select a.name from system.user a where a.user_id=partner) as partner,
                                comments
                            from
                                project.project
                            where project_id=%s
                        """%data['project_id']).dictresult()[0]
                        form=db.query("""
                            select
                                name,
                                columns_number,
                                rows,
                                columns,
                                (select a.name from system.user a where a.user_id=assigned_to) as assigned_to,
                                to_char(resolved_date,'DD/MM/YYYY HH24:MI:SS') as resolved_date,
                                to_char(first_revision_date,'DD/MM/YYYY HH24:MI:SS') as first_revision_date
                                --,revisions
                            from
                                project.form
                            where
                                form_id=%s
                        """%data['form_id']).dictresult()[0]
                        wb = Workbook()
                        ws = wb.create_sheet('Hoja1',0)

                        company_style=Font(
                            name='Times New Roman',
                            size=14,
                            bold=True,
                            italic=False,
                            color='FF000080'
                        )
                        project_style=Font(
                            name='Times New Roman',
                            size=14,
                            bold=False,
                            italic=True,
                            color='FF000080'
                        )
                        formname_style=Font(
                            name='Times New Roman',
                            size=14,
                            bold=False,
                            italic=False,
                            color='FF000080'
                        )

                        header_style=NamedStyle(name='header_style')
                        header_style.font=Font(
                            name='Times New Roman',
                            size=14,
                            bold=True,
                            italic=False,
                            color='FFFFFFFF'
                        )
                        header_style.fill=PatternFill("solid", fgColor="FF000099")
                        header_style.alignment=Alignment(horizontal='center')
                        header_style.border=Border(
                            left=Side(border_style='thin',color='FF000000'),
                            right=Side(border_style='thin',color='FF000000'),
                            top=Side(border_style='thin',color='FF000000'),
                            bottom=Side(border_style='thin',color='FF000000')
                        )

                        content_style=NamedStyle(name='content_style')
                        content_style.font=Font(
                            name='Times New Roman',
                            size=12,
                            bold=False,
                            italic=False,
                            color='FF000000'
                        )
                        content_style.alignment=Alignment(
                            horizontal='justify',
                            vertical='center',
                            text_rotation=0,
                            wrap_text=True,
                            shrink_to_fit=False,
                            indent=0)
                        # wrap_text=True,shrink_to_fit=False,vertical='justify',horizontal='left')
                        content_style.border=Border(
                            left=Side(border_style='thin',color='FF000000'),
                            right=Side(border_style='thin',color='FF000000'),
                            top=Side(border_style='thin',color='FF000000'),
                            bottom=Side(border_style='thin',color='FF000000')
                        )

                        ws.sheet_view.showGridLines = False #ocultar líneas

                        ws['B2']=project['company_name']
                        ws['B2'].font=company_style
                        ws['B3']=project['name']
                        ws['B3'].font=project_style
                        ws['B4']=form['name']
                        ws['B4'].font=formname_style

                        columns=eval(form['columns'])
                        col_num=2
                        for c in columns:
                            ws.cell(column=col_num,row=6,value=c['name'])
                            ws.cell(column=col_num,row=6).style=header_style
                            col_num+=1
                        ws.cell(column=col_num,row=6,value='Revisión')
                        ws.cell(column=col_num,row=6).style=header_style

                        form_info=db.query("""
                            select * from form.project_%s_form_%s order by entry_id
                        """%(data['project_id'],data['form_id'])).dictresult()
                        row=7

                        for x in form_info:
                            keys=sorted(x.iteritems())
                            col_num=2
                            for k in keys:
                                if k[0].split('_')[0]=='col':
                                    ws.cell(column=col_num,row=row,value=k[1].decode('utf-8'))
                                    ws.cell(column=col_num,row=row).style=content_style

                                    col_num+=1
                            ws.cell(column=col_num,row=row,value=x['rev_1'].decode('utf-8'))
                            ws.cell(column=col_num,row=row).style=content_style
                            row+=1

                        last_info_row=row

                        #agregar quién realizó el formulario
                        revisions=db.query("""
                            select (select a.name from system.user a where a.user_id=b.user_id) as user_name,
                            b.revision_number, to_char(b.revision_date,'DD/MM/YYYY HH24:MI:SS') as revision_date
                            from project.form_revisions b where b.form_id=%s order by b.revision_number asc
                        """%data['form_id']).dictresult()
                        bd = Side(style='thick', color="000000")
                        th = Side(style='thin', color="000000")

                        col_num+=2
                        ws.cell(column=col_num,row=6).border=Border(left=bd,top=bd,bottom=th)
                        ws.cell(column=col_num+1,row=6,value='Nombre')
                        ws.cell(column=col_num+1,row=6).font=Font(name='Times New Roman', size=12, bold=True)
                        ws.cell(column=col_num+1,row=6).border=Border(top=bd,bottom=th)
                        ws.cell(column=col_num+2,row=6,value='Fecha')
                        ws.cell(column=col_num+2,row=6).font=Font(name='Times New Roman', size=12, bold=True)
                        ws.cell(column=col_num+2,row=6).border=Border(top=bd,right=bd,bottom=th)

                        ws.cell(column=col_num,row=7,value='Encargado')
                        ws.cell(column=col_num,row=7).font=Font(name='Times New Roman', size=12, bold=True)
                        ws.cell(column=col_num,row=7).border=Border(left=bd)
                        ws.cell(column=col_num+1,row=7,value=form['assigned_to'])
                        ws.cell(column=col_num+1,row=7).font=Font(name='Times New Roman', size=12, bold=False)
                        ws.cell(column=col_num+2,row=7,value=form['resolved_date'])
                        ws.cell(column=col_num+2,row=7).font=Font(name='Times New Roman', size=12, bold=False)
                        ws.cell(column=col_num+2,row=7).border=Border(right=bd)

                        current_row=8
                        for r in revisions:
                            ws.cell(column=col_num,row=current_row,value='Revisor')
                            ws.cell(column=col_num,row=current_row).font=Font(name='Times New Roman', size=12, bold=True)
                            ws.cell(column=col_num,row=current_row).border=Border(left=bd)
                            # revisor=db.query("""
                            #     select name from system.user where user_id=%s
                            # """%int(form['revisions'].split(",")[0].split(":")[1])).dictresult()[0]
                            ws.cell(column=col_num+1,row=current_row,value=r['user_name'])
                            ws.cell(column=col_num+1,row=current_row).font=Font(name='Times New Roman', size=12, bold=False)
                            ws.cell(column=col_num+2,row=current_row,value=r['revision_date'])
                            ws.cell(column=col_num+2,row=current_row).font=Font(name='Times New Roman', size=12, bold=False)
                            ws.cell(column=col_num+2,row=current_row).border=Border(right=bd)
                            current_row+=1

                        ws.cell(column=col_num,row=current_row,value='Gerente')
                        ws.cell(column=col_num,row=current_row).font=Font(name='Times New Roman', size=12, bold=True)
                        ws.cell(column=col_num,row=current_row).border=Border(left=bd)
                        ws.cell(column=col_num+1,row=current_row,value=project['manager'])
                        ws.cell(column=col_num+1,row=current_row).font=Font(name='Times New Roman', size=12, bold=False)
                        ws.cell(column=col_num+2,row=current_row).border=Border(right=bd)
                        current_row+=1

                        ws.cell(column=col_num,row=current_row,value='Socio')
                        ws.cell(column=col_num,row=current_row).font=Font(name='Times New Roman', size=12, bold=True)
                        ws.cell(column=col_num,row=current_row).border=Border(left=bd,bottom=bd)
                        ws.cell(column=col_num+1,row=current_row).border=Border(bottom=bd)
                        ws.cell(column=col_num+1,row=current_row,value=project['partner'])
                        ws.cell(column=col_num+1,row=current_row).font=Font(name='Times New Roman', size=12, bold=False)
                        ws.cell(column=col_num+2,row=current_row).border=Border(right=bd,bottom=bd)


                        for column_cells in ws.columns:
                            length = max(len(GF.as_text(cell.value))+5 for cell in column_cells)
                            ws.column_dimensions[column_cells[0].column].width = length


                        #revisar si hay observaciones del formulario
                        comments=db.query("""
                            select b.comment, to_char(b.created,'DD/MM/YYYY HH24:MI:SS') as created, (select a.name from system.user a where a.user_id=b.user_id) as user_name from project.form_comments b where b.form_id=%s
                        """%data['form_id']).dictresult()
                        if comments!=[]:
                            comm_header_style=NamedStyle(name='comm_header_style')
                            comm_header_style.font=Font(
                                name='Times New Roman',
                                size=14,
                                bold=True,
                                italic=False,
                                color='FFFFFFFF'
                            )
                            comm_header_style.fill=PatternFill("solid", fgColor="FF7082D4")
                            comm_header_style.alignment=Alignment(horizontal='center')
                            comm_header_style.border=Border(
                                left=Side(border_style='thin',color='FF000000'),
                                right=Side(border_style='thin',color='FF000000'),
                                top=Side(border_style='thin',color='FF000000'),
                                bottom=Side(border_style='thin',color='FF000000')
                            )

                            wo = wb.create_sheet('Observaciones',1)
                            row=2
                            wo.cell(column=2, row=row, value='Por')
                            wo.cell(column=2, row=row).style=comm_header_style
                            wo.cell(column=3, row=row, value='Fecha')
                            wo.cell(column=3, row=row).style=comm_header_style
                            wo.cell(column=4, row=row, value='Observación')
                            wo.cell(column=4, row=row).style=comm_header_style
                            row+=1
                            for x in comments:
                                wo.cell(column=2,row=row,value=x['user_name'])
                                wo.cell(column=2,row=row).style=content_style
                                wo.cell(column=3,row=row,value=x['created'])
                                wo.cell(column=3,row=row).style=content_style
                                wo.cell(column=4,row=row,value=x['comment'])
                                wo.cell(column=4,row=row).style=content_style
                                row+=1

                            for column_cells in wo.columns:
                                length = max(len(GF.as_text(cell.value))+5 for cell in column_cells)
                                wo.column_dimensions[column_cells[0].column].width = length





                        #Descarga de archivo
                        time=strftime("%H_%M_%S", gmtime())
                        path=os.path.join(cfg.uploaded_forms_files_path,'Reporte%s.xlsx'%time)
                        wb.save(path)
                        response['success']=True
                        response['msg_response']='El formulario ha sido generado.'
                        response['filename']='/project/downloadFile/report/Reporte%s.xlsx'%time
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/downloadFile/<type>/<filename>', methods=['GET','POST'])
@is_logged_in
def downloadReport(type,filename):
    response={}
    try:
        if type=='report':
            path=os.path.join(cfg.uploaded_forms_files_path,filename)
        name="%s"%filename
        return send_file(path,attachment_filename=name)
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
        return response

@bp.route('/uploadFormZipFile', methods=['GET','POST'])
@is_logged_in
def uploadFormZipFile():
    #cargar archivo zip a formulario
    response={}
    try:
        if request.method=='POST':
            data=request.form.to_dict()
            success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'resolve_forms'})
            if success:
                if allowed:
                    file=request.files[data['file_name'].encode('utf-8')]
                    filename=secure_filename(file.filename)
                    folder_path=os.path.join(cfg.zip_main_folder,'project_%s'%int(data['project_id']),'form_%s'%int(data['form_id']))
                    if not os.path.exists(folder_path):
                        os.makedirs(folder_path)
                    else:
                        existing_files = glob.glob(folder_path+'/*')
                        for f in existing_files:
                            os.remove(f)
                    file.save(os.path.join(folder_path,filename))
                    db.query("""
                        update project.form
                        set zip_file_name='%s',
                        zip_last_upload_user=%s,
                        zip_last_upload_date='now'
                        where form_id=%s and project_id=%s
                    """%(filename,data['user_id'],data['form_id'],data['project_id']))
                    response['success']=True
                    response['msg_response']='El archivo zip ha sido cargado.'
                else:
                    response['success']=False
                    response['msg_response']='No tienes permisos para realizar esta acción.'
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
    return json.dumps(response)

@bp.route('/allowedFormZip',methods=['GET','POST'])
@is_logged_in
def allowedFormZip():
    #verifica si tiene permisos para subir o descargar el archivo zip del formulario
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'resolve_forms'})
                if success:
                    if allowed:
                        response['success']=True
                        form_users=db.query("""
                            select assigned_to, status_id,
                            --revisions,
                            project_id from project.form
                            where form_id=%s
                        """%data['form_id']).dictresult()[0]
                        if (form_users['status_id']<7 and data['from']=='upload') or data['from']=='download':
                            if int(data['user_id'])==int(form_users['assigned_to']):
                                response['allowed']=True
                            else:
                                revisions=db.query("""
                                    select user_id from project.form_revisions where form_id=%s
                                """%data['form_id']).dictresult()
                                # rev_list=form_users['revisions'].split(",")
                                # for x in rev_list:
                                for r in revisions:
                                    # if int(x.split(":")[1])==int(data['user_id']):
                                    if int(r['user_id'])==int(data['user_id']):
                                        response['allowed']=True
                                        break
                                    else:
                                        response['allowed']=False
                                        if data['from']=='upload':
                                            response['msg_response']='No tienes permitido subir un archivo relacionado a este formulario.'
                                        else:
                                            response['msg_response']='No tienes permitido descargar archivos de este formulario.'
                                if response['allowed']==False:
                                    project_users=db.query("""
                                        select manager,partner from project.project
                                        where project_id=%s
                                    """%form_users['project_id']).dictresult()[0]
                                    if int(data['user_id'])==int(project_users['manager']) or int(data['user_id'])==int(project_users['partner']):
                                        response['allowed']=True
                                    else:
                                        response['allowed']=False
                                        if data['from']=='upload':
                                            response['msg_response']='No tienes permitido subir un archivo relacionado a este formulario.'
                                        else:
                                            response['msg_response']='No tienes permitido descargar archivos de este formulario.'
                        else:
                            response['allowed']=False
                            response['msg_response']='Este formulario se encuentra cerrado, por lo tanto no puede ser cargado ningún archivo nuevo.'
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/getZipDownloadLink', methods=["GET","POST"])
@is_logged_in
def getZipDownloadLink():
    #obtiene el link para la descarga del archivo zip del formulario
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'resolve_forms'})
                if success:
                    if allowed:
                        zip_file=db.query("""
                            select zip_file_name
                            from project.form
                            where form_id=%s
                        """%data['form_id']).dictresult()[0]
                        response['success']=True
                        if zip_file['zip_file_name']!='':
                            file_link='/project/downloadZipFile/%s/%s/%s'%(data['project_id'],data['form_id'],zip_file['zip_file_name'])
                            response['file']=file_link
                            response['has_file']=True
                            response['msg_response']='El archivo se encuentra disponible.'
                        else:
                            response['has_file']=False
                            response['msg_response']='No hay ningún archivo por descargar.'
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/downloadZipFile/<project_id>/<form_id>/<filename>', methods=['GET','POST'])
@is_logged_in
def downloadZipFile(project_id,form_id,filename):
    #realiza descarga de archivo zip
    #no requiere validación de permisos
    response={}
    try:
        path=os.path.join(cfg.zip_main_folder,'project_%s'%project_id,'form_%s'%form_id,filename)
        name="%s"%filename
        return send_file(path,attachment_filename=name)
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
        return response

@bp.route('/getUsersForRevision', methods=['GET','POST'])
@is_logged_in
def getUsersForRevision():
    #obtiene los usuarios a quienes se les puede regresar el formulario o pasar para revisión
    #no requiere validación de permisos
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                revisions=db.query("""
                    select a.user_id, b.name, a.revision_number, a.currently_assigned
                    from system.user b,
                    project.form_revisions a
                    where form_id=%s
                    and a.user_id=b.user_id order by revision_number asc
                """%data['form_id']).dictresult()
                assignee=db.query("""
                    select a.assigned_to as user_id, b.name from system.user b, project.form a
                    where a.form_id=%s
                    and a.assigned_to=b.user_id
                """%data['form_id']).dictresult()[0]
                send_to=[]
                return_to=[]
                assignee['name']='%s - Asignado'%assignee['name']
                return_to.append(assignee)
                one_more=False
                for r in revisions:
                    if one_more==True:
                        send_to.append({'user_id':r['user_id'],'name':"%s - Revisión %s"%(r['name'],r['revision_number'])})
                        break
                    else:
                        if r['currently_assigned']==True:
                            one_more=True
                        else:
                            return_to.append({'user_id':r['user_id'],'name':"%s - Revisión %s"%(r['name'],r['revision_number'])})
                if send_to==[]:
                    send_to.append({'user_id':-101,'name':'Cerrar formulario'})

                response['success']=True
                response['send_to']=send_to
                response['return_to']=return_to
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/doRevision', methods=['GET','POST'])
@is_logged_in
def doRevision():
    #realizar revisión de formulario, ya sea regresarlo, mandarlo a la siguiente revisión o cerrarlo
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'resolve_forms'})
                if success:
                    if allowed:
                        if int(data['user_to'])==-101: #revisar si va a cerrar el formulario
                            #buscar el usuario que tiene la última revisión del formulario
                            last_revision=db.query("""
                                select revision_id, user_id
                                from project.form_revisions
                                where form_id=%s order by revision_number desc limit 1
                            """%data['form_id']).dictresult()[0]
                            if int(last_revision['user_id'])==int(data['user_id']): # si es el usuario de la última revisión, se cambia el status del formulario a cerrado
                                db.query("""
                                    update project.form set
                                    status_id=7,
                                    user_last_update=%s,
                                    last_updated='now'
                                    where form_id=%s
                                """%(data['user_id'],data['form_id']))
                                #se actualiza la fecha de la revisión
                                db.query("""
                                    update project.form_revisions
                                    set revision_date='now'
                                    where form_id=%s and user_id=%s
                                """%(data['form_id'],data['user_id']))

                                users_notif=db.query("""
                                    select user_id from project.form_revisions where user_id!=%s and form_id=%s
                                    union select assigned_to as user_id from project.form where form_id=%s
                                """%(data['user_id'],data['form_id'],data['form_id'])).dictresult()
                                info={
                                    'form_id':data['form_id'],
                                    'project_id':data['project_id'],
                                    'msg':data['msg']
                                }
                                for un in users_notif:
                                    info['user_to']=un['user_id']
                                    # se envía notificación a usuarios correspondientes
                                    GF.createNotification('close_form',info)
                        else:
                            #si no se va a cerrar el formulario
                            #se revisa si se va a regresar al usuario asignado a resolver el formulario
                            check_assignee=db.query("""
                                select assigned_to from project.form
                                where form_id=%s
                            """%data['form_id']).dictresult()[0]
                            if int(check_assignee['assigned_to'])==int(data['user_to']):
                                #si es el usuario asignado, se cambia status a publicado
                                db.query("""
                                    update project.form
                                    set status_id=3, user_last_update=%s,
                                    last_updated='now' where form_id=%s
                                """%(data['user_id'],data['form_id']))
                                #se actualiza a quien está asignada la revisión
                                db.query("""
                                    update project.form_revisions set
                                    currently_assigned=False where form_id=%s
                                """%(data['form_id']))
                                notif_info={'project_id':data['project_id'],'form_id':data['form_id'],'msg':data['msg']}
                                GF.createNotification('return_form',notif_info)
                            else:
                                #en caso de que se cambie de revisor
                                current_revision=db.query("""
                                    select * from project.form_revisions where
                                    form_id=%s and currently_assigned=True
                                """%data['form_id']).dictresult()[0]
                                #se actualiza quien y cuando fue la última vez que se actualizó el formulario
                                db.query("""
                                    update project.form set
                                    user_last_update=%s, last_updated='now', status_id=6
                                    where form_id=%s
                                """%(data['user_id'],data['form_id']))
                                user_update=""
                                if int(current_revision['user_id'])!=int(data['user_id']):
                                    user_update=",user_update=%s"%data['user_id']
                                db.query("""
                                    update project.form_revisions set currently_assigned=False,
                                    revision_date='now' %s where form_id=%s and currently_assigned=True
                                """%(user_update,data['form_id']))
                                db.query("""
                                    update project.form_revisions set currently_assigned=True
                                    where form_id=%s and user_id=%s
                                """%(data['form_id'],data['user_to']))
                                notif_info={'project_id':data['project_id'],'form_id':data['form_id'],'msg':data['msg'],'user_to':data['user_to']}
                                GF.createNotification('send_next_revision',notif_info)

                        response['success']=True
                        response['msg_response']='El formulario ha sido actualizado.'
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/getPrintingInfo', methods=['GET','POST'])
@is_logged_in
def getPrintingInfo():
    #regresa la información del formulario para su vista de impresión
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'download_forms'})
                if success:
                    if allowed:
                        form=db.query("""
                            select name, (select a.name from system.user a where a.user_id=assigned_to) as assigned_to,
                            to_char(resolved_date,'DD/MM/YYYY HH24:MI:SS') as resolved_date
                            from project.form where form_id=%s
                        """%data['form_id']).dictresult()[0]
                        project=db.query("""
                            select name, company_name, (select a.name from system.user a where a.user_id=manager)  as manager,
                            (select a.name from system.user a where a.user_id=partner) as partner
                            from project.project where project_id=%s
                        """%data['project_id']).dictresult()[0]
                        revisions=db.query("""
                            select user_id, revision_number, to_char(revision_date,'DD/MM/YYYY HH24:MI:SS') as revision_date
                            from project.form_revisions where form_id=%s order by revision_number asc
                        """%data['form_id']).dictresult()
                        html='<p style="font-size:1.6em;">{name}</p><p style="font-size:1.4em;">{company_name}</p>'.format(**project)
                        html+='<p style="font-size:1.2em; font-weight:bold;">{name}</p><p><b>Realizado por:</b> {assigned_to} - {resolved_date}</p>'.format(**form)
                        for x in revisions:
                            name=db.query("select name from system.user where user_id=%s"%x['user_id']).dictresult()[0]['name']
                            x['name']=name
                            html+='<p><b>Revisión {revision_number}:</b> {name} - {revision_date}</p>'.format(**x)
                        html+='<p><b>Gerente:</b> {manager}</p><p><b>Socio:</b> {partner}</p>'.format(**project)
                        response['success']=True
                        response['html']=html
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/checkRightPanelPermission', methods=['GET','POST'])
@is_logged_in
def checkRightPanelPermission():
    #revisar si tiene permisos para crear formularios, para mostrar el panel derecho de formularios por revisar y formularios por publicar
    #no requiere validación
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                permission=db.query("""
                    select create_forms from system.user where user_id=%s
                """%data['user_id']).dictresult()[0]
                if permission['create_forms']==True:
                    response['allowed']=True
                else:
                    response['allowed']=False
                response['success']=True
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/cloneForm', methods=['GET','POST'])
@is_logged_in
def cloneForm():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'create_forms'})
                if success:
                    if allowed:
                        ofi=db.query("""
                            select * from project.form where form_id=%s
                        """%data['old_form_id']).dictresult()[0]
                        new_form={
                            'project_id':ofi['project_id'],
                            'name':data['form_name'],
                            'columns_number':ofi['columns_number'],
                            'rows':ofi['rows'],
                            'columns':ofi['columns'],
                            'created_by':data['user_id'],
                            'create_date':'now',
                            'folder_id':data['new_folder_id'],
                            'status_id':2,
                            'user_last_update':data['user_id'],
                            'last_updated':'now'
                        }
                        inserted_form=db.insert('project.form',new_form)

                        columns=eval(ofi['columns'])

                        table_name='project_%s_form_%s'%(inserted_form['project_id'],inserted_form['form_id'])
                        columns_str=""
                        including_columns=[]
                        for x in columns:
                            columns_str+=" ,col_%s text default ''"%x['order']
                            if x['editable']==False:
                                including_columns.append("col_%s"%x['order'])

                        db.query("""
                            CREATE TABLE form.%s(
                                entry_id serial not null primary key,
                                form_id integer not null,
                                project_id integer not null
                                %s
                            );
                        """%(table_name,columns_str))

                        old_form_table='project_%s_form_%s'%(ofi['project_id'],ofi['form_id'])
                        old_info=db.query("""
                            select * from form.%s order by entry_id
                        """%old_form_table).dictresult()
                        for oi in old_info:
                            entry={
                                'form_id':inserted_form['form_id'],
                                'project_id':inserted_form['project_id']
                            }
                            if including_columns!=[]:
                                for ic in including_columns:
                                    entry[ic]=oi[ic]
                            db.insert('form.%s'%table_name,entry)
                        response['success']=True
                        response['msg_response']='El formulario ha sido clonado exitosamente.'
                    else:
                        response['success']=False
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['success']=False
                    response['msg_response']='Ocurrió un error al intentar validar la información.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error obtener la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)
