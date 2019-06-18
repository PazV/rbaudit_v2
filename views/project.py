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
    return render_template('project.html',g=g)

@bp.route('/<project_factor>',methods=['GET','POST'])
@is_logged_in
def goToProject(project_factor):
    project_id=int(project_factor)/int(cfg.project_factor)
    g=GF.userInfo([{'project_id':project_id},{'project_factor':project_factor}])
    g.project_factor=project_factor
    return render_template('project.html',g=g)


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
                    db.insert('project.project',project_info)
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
    return render_template('createform_step1.html',g=g)



@bp.route("/<int:project_factor>/createform/step-2/<int:form>", methods=['GET','POST'])
@is_logged_in
def createformStep2(form,project_factor):
    project_id=int(project_factor)/int(cfg.project_factor)
    g=GF.userInfo([{'form_id':form},{'project_id':project_id},{'project_factor':project_factor}])
    # g.form_id=form
    g.project_factor=project_factor
    return render_template('createform_step2.html',g=g)


@bp.route("/saveFormStep1", methods=['GET','POST'])
@is_logged_in
def saveFormStep1():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                if data['form_id']==-1:
                    form_info=copy.deepcopy(data)
                    del form_info['form_id']
                    form_info['created_by']=form_info['user_id']
                    form_info['create_date']='now()'
                    new_form=db.insert('project.form',form_info)
                    response['success']=True
                    response['form_id']=new_form['form_id']

                    # g=GF.userInfo()
                    # g.form_id=new_form['form_id']
                    # return render_template('createform_step2.html',g=g)
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
            app.logger.info(data)
            if valid:
                forms=db.query("""
                    select
                        form_id, name
                    from
                        project.form
                    where
                        project_id=%s
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
