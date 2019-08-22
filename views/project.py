#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g
from wtforms import Form, StringField, TextAreaField, PasswordField, validators
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
import logging
from .login import is_logged_in
import json
import copy
import sys
import traceback
from .db_connection import getDB
db = getDB()
from flask import current_app as app
import app_config as cfg
from . import general_functions
GF = general_functions.GeneralFunctions()


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


@bp.route('/saveProject', methods=['GET','POST'])
@is_logged_in
def saveProject():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
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
    response={}
    try:
        if request.method=='POST':
            projects=db.query("""
                select project_id, name, (project_id*%d) as project_factor
                from project.project
                order by created desc
            """%int(cfg.project_factor)).dictresult()
            # app.logger.info(projects)
            response['success']=True
            response['data']=projects
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)


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


@bp.route("/saveFormStep1", methods=['GET','POST'])
@is_logged_in
def saveFormStep1():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                if data['form_id']==-1: #formulario nuevo
                    form_info=copy.deepcopy(data)
                    del form_info['form_id']
                    form_info['created_by']=form_info['user_id']
                    form_info['create_date']='now()'
                    form_info['status_id']=1
                    form_info['published']=False
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
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
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
                        fh_node='<li class="selectable-folder"><a href="#" data-folder="%s">%s</a><ul>'%(f['folder_id'],f['name'])
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
                    forms_str+='<li><a href="%s" id="%s">%s</a></li>'%(url,f['form_id'],f['name'])
                return fh_html+forms_str+sh_html
        else:
            forms_str=""
            if forms!=[]:
                for f in forms:
                    project_factor=int(project_id)*int(cfg.project_factor)
                    url='/project/%s/%s'%(project_factor,f['form_id'])
                    forms_str+='<li><a href="%s" id="%s">%s</a></li>'%(url,f['form_id'],f['name'])
            current_level=""
            for x in folders:
                fh_new_node='<li class="selectable-folder"><a href="#" data-folder="%s">%s</a><ul>'%(x['folder_id'],x['name'])
                sh_new_node='</ul></li>'
                res_node=getMenuNodes(x['folder_id'],fh_new_node,sh_new_node,project_id)
                current_level+=res_node

            return fh_html+forms_str+current_level+sh_html
    except:
        app.logger.info(traceback.format_exc(sys.exc_info()))

@bp.route('/deleteFolder', methods=['GET','POST'])
@is_logged_in
def deleteFolder():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                funcion
                #función para validar si la carpeta tiene subcarpetas o archivos
                # db.query("""
                #     select count(*) from
                # """)
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


@bp.route('/createFormTable', methods=['GET','POST'])
@is_logged_in
def createFormTable():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                page=(int(data['page'])*10)-10
                form_info=db.query("""
                    select form_id,project_id,columns_number, rows, columns,name,
                    to_char(last_updated, 'DD-MM-YYYY HH24:MI:SS') as last_updated,
                    (select u.name from system.user u where u.user_id=user_last_update) as user_last_update
                    from project.form
                    where form_id=%s
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
                response['last_updated']='Actualizado %s por %s'%(form_info[0]['last_updated'],form_info[0]['user_last_update'])
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
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
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
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                revisions=[]
                for k,v in data.iteritems():
                    if k.split('_')[0]=='revision':
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
                GF.createNotification('publish_form',data['project_id'],data['form_id'])
                response['success']=True
                response['msg_response']='El formulario ha sido publicado, puede encontrarlo en el menú del lado izquierdo.'
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
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                page=(int(data['page'])*10)-10
                form_info=db.query("""
                    select form_id,project_id,columns_number, rows, columns, name, assigned_to, status_id,
                    to_char(last_updated, 'DD-MM-YYYY HH24:MI:SS') as last_updated,
                    (select u.name from system.user u where u.user_id=user_last_update) as user_last_update
                    from project.form
                    where form_id=%s
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
                response['last_updated']='Actualizado %s por %s'%(form_info[0]['last_updated'],form_info[0]['user_last_update'])
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
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                allowed_users=db.query("""
                    select
                        f.assigned_to,
                        f.revisions,
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

                match=False
                readonly=False
                if int(allowed_users['partner'])==int(data['user_id']) or int(allowed_users['manager'])==int(data['user_id']): #si es socio o gerente del proyecto, tiene acceso a editar y/o ver formularios en todo momento
                    match=True
                    readonly=False
                else:
                    if int(allowed_users['status_id'])<5: #si está en proceso de llenado o configuración del formulario
                        for k,v in allowed_users.iteritems():
                            if k=='revisions':
                                revision_list=v.split(",")
                                for r in revision_list:
                                    if int(r.split(":")[1])==int(data['user_id']):
                                        match=True #si es revisor, tiene permiso de ver el formulario y editarlo
                                        break
                                    break
                            else:
                                if v!='project_id' or v!='status_id':
                                    if int(v)==int(data['user_id']):
                                        match=True #si tiene asignado el formulario, tiene permisos para verlo
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
                    else: #si se encuentra en la etapa de revisión
                        if int(data['user_id'])==int(allowed_users['assigned_to']): #si es el usuario a quien fue asignado el formulario
                            match=True #puede verlo
                            readonly=True #no puede editarlo
                        else:
                            rev_list=allowed_users['revisions'].split(",") #se busca si está entre los revisores
                            app.logger.info(rev_list)
                            for r in rev_list:
                                if int(r.split(":")[1])==int(data['user_id']):
                                    match=True #si está entre los revisores, puede verlo
                                    readonly=False #y puede editarlo
                                    break
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
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                info=db.query("""
                    select
                        (select a.name from system.user a where a.user_id=f.assigned_to) as assigned_to,
                        f.revisions,
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

                rev_list=info['revisions'].split(',')
                for r in rev_list:
                    rev='Revisión %s'%((r.split(":")[0]).split("_")[1])
                    user_rev=db.query("""
                        select name from system.user where user_id=%s
                    """%r.split(":")[1]).dictresult()[0]
                    html+='<b>%s: </b>%s<br>'%(rev.decode('utf-8'),user_rev['name'].decode('utf-8'))

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
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                for x in data['table_data']:
                    update_list=[]
                    for key,value in x.iteritems():
                        if key.split("_")[0]=='col' or key.split("_")[0]=='rev':
                            update_list.append("%s='%s'"%(key,value))
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
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                db.query("""
                    update project.form
                    set
                        status_id=5,
                        user_last_update=%s,
                        last_updated='now'
                    where
                        form_id=%s
                    and project_id=%s
                """%(data['user_id'],data['form_id'],data['project_id']))
                GF.createNotification('send_to_revision1',data['project_id'],data['form_id'])
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

@bp.route('/<path:subpath>/getFormsToCheck', methods=['GET','POST'])
@is_logged_in
def getFormsToCheck(subpath):
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
                        revs=f['revisions'].split(",")
                        for r in revs:
                            if int(r.split(":")[1])==int(data['user_id']):
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
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                form=db.query("""
                    select
                        status_id, revisions
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
                        rev_list=form[0]['revisions'].split(",")
                        app.logger.info("rev_list")
                        app.logger.info(rev_list)
                        for r in rev_list: #verifica si el usuario es alguno de los revisores
                            if int(data['user_id'])==int(r.split(":")[1]):
                                app.logger.info("allowed")
                                response['allowed']=True
                                break
                        if 'allowed' not in response:
                            response['allowed']=False
                            response['msg_response']='Usted no tiene permisos para revisar este formulario.'
                else:
                    response['msg_response']='El formulario no se encuentra disponible para ser revisado.'
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

@bp.route('/returnFormToAssignee', methods=['GET','POST'])
@is_logged_in
def returnFormToAssignee():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                db.query("""
                    update project.form
                    set status_id=3,
                    user_last_update=%s,
                    last_updated='now'
                    where form_id=%s
                """%(data['user_id'],data['form_id']))
                GF.createNotification('return_form',data['project_id'],data['form_id'],data['msg'])
                response['success']=True
                response['msg_response']='El formulario ha sido enviado a corregir.'
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

@bp.route('/finishCheckingForm', methods=['GET','POST'])
@is_logged_in
def finishCheckingForm():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                db.query("""
                    update project.form
                    set status_id=7,
                    user_last_update=%s,
                    last_updated='now'
                    where form_id=%s
                """%(data['user_id'],data['form_id']))
                GF.createNotification('finish_revision1_torev2',data['project_id'],data['form_id'],data['msg'])
                GF.createNotification('finish_revision1_toassignee',data['project_id'],data['form_id'],data['msg'])
                response['success']=True
                response['msg_response']='El formulario ha sido actualizado con éxito.'
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

@bp.route('/checkAddComment', methods=['GET','POST'])
@is_logged_in
def checkAddComment():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                form_info=db.query("""
                    select revisions,project_id
                    from project.form
                    where form_id=%s
                """%data['form_id']).dictresult()[0]
                user_list=[]
                revs=form_info['revisions'].split(",")
                for r in revs:
                    user_list.append(int(r.split(":")[1]))
                managers=db.query("""
                    select manager,partner from project.project
                    where project_id=%s
                """%form_info['project_id']).dictresult()[0]
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
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                check=db.query("""
                    select assigned_to from project.form
                    where form_id=%s
                """%data['form_id']).dictresult()[0]
                if int(check['assigned_to'])==int(data['user_id']):
                    response['allowed']=True
                else:
                    response['allowed']=False
                    response['msg_response']='No tienes permiso para enviar a revisión este formulario.'
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
