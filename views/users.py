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
import cssutils


bp = Blueprint('users', __name__,  url_prefix='/users' )

@bp.route('/saveUser',methods=['GET','POST'])
@is_logged_in
def saveUser():
    #guardar los datos de un usuario
    response={}
    try:
        if request.method=='POST':
            data=request.form.to_dict()
            success,allowed=GF.checkPermission({'user_id':data['this_user'],'permission':'create_users'})
            if success:
                if allowed:
                    user_data=copy.deepcopy(data) #deepcopy significa que los cambios en el nuevo dict no afectarán el dict original
                    if str(data['user_id'])=='-1': #nuevo usuario
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
                            mail_body='Se ha registrado al usuario %s. <br><br> <b>Correo:</b> %s, <br> <b>Contraseña:</b> %s<br><br><a href="%s">Acceder</a>'%(new_user['name'],new_user['email'],passwd,cfg.host)
                            GF.sendMail('Nuevo usuario',mail_body,user_data['email'])
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
                                """%('img_user_%s%s'%(new_user['user_id'],ext),class_name,new_user['user_id']))
                                # css_class=".%s{content:url('%s');}"%(class_name,os.path.join(cfg.class_img_path,'img_user_%s%s'%(new_user['user_id'],ext)))
                                img_path=os.path.join(cfg.class_img_path,'img_user_%s%s'%(new_user['user_id'],ext))
                                style=cssutils.css.CSSStyleDeclaration(cssText='content:url(%s);'%img_path)
                                css_class=cssutils.css.CSSStyleRule(selectorText='.'+class_name,style=style)
                                with open(cfg.profile_css_file, "a") as f:
                                    f.write(css_class.cssText)

                        else:
                            response['success']=False
                            response['msg_response']='Ya existe un usuario registrado con el correo %s.'%data['email']
                    else: #editar usuario
                        response['success']=False
                        if data['password_data']!='false':
                            password_info=json.loads(data['password_data'])
                            user_info=db.query("""
                                select password,
                                profile_picture, profile_picture_class
                                from system.user
                                where user_id=%s
                            """%data['user_id']).dictresult()

                            if check_password_hash(user_info[0]['password'],password_info['old_password']):
                                if password_info['new_password'].replace(" ","")==password_info['confirm_password'].replace(" ",""):
                                    if len(password_info['new_password'])>=6:
                                        if password_info['new_password']!=password_info['old_password']:
                                            new_pass=" ,password='%s'"%generate_password_hash(password_info['new_password'])
                                        else:
                                            response['msg_response']='La nueva contraseña debe ser diferente de la anterior.'
                                    else:
                                        response['msg_response']='La contraseña debe tener al menos 6 caracteres.'
                                else:
                                    response['msg_response']='Las contraseñas no coinciden, favor de revisar.'
                            else:
                                response['msg_response']='La contraseña actual es incorrecta, favor de revisar.'
                        else:
                            new_pass=""
                        if data['file_name']!='false':
                            files=request.files
                            file_path=cfg.profile_img_path
                            file=files[data['file_name']]
                            filename=secure_filename(file.filename)
                            file.save(os.path.join(file_path,filename))
                            fname,ext=os.path.splitext(os.path.join(file_path,filename))
                            os.rename(os.path.join(file_path,filename),os.path.join(file_path,'img_user_%s%s'%(data['user_id'],ext)))
                            class_name='profileimage-user-%s-'%data['user_id']
                            profile_picture=" ,profile_picture='img_user_%s%s'"%(data['user_id'],ext)
                            profile_picture_class=" ,profile_picture_class='%s'"%class_name

                            img_path=os.path.join(cfg.class_img_path,'img_user_%s%s'%(data['user_id'],ext))
                            style=cssutils.css.CSSStyleDeclaration(cssText='content:url(%s);'%img_path)
                            css_class=cssutils.css.CSSStyleRule(selectorText='.'+class_name,style=style)
                            with open(cfg.profile_css_file, "a") as f:
                                f.write(css_class.cssText)
                        else:
                            profile_picture=""
                            profile_picture_class=""

                        mail=db.query("""
                            select count(*) from system.user where email='%s' and user_id <>%s
                        """%(data['email'].strip(),data['user_id'])).dictresult()[0]
                        mail['count']=0
                        if mail['count']>0:
                            response['msg_response']='Este correo ya se encuentra registrado, favor de ingresar otro.'
                        else:
                            db.query("""
                                update system.user
                                set name='%s', email='%s' %s %s %s
                                where user_id=%s
                            """%(data['name'],data['email'],new_pass,profile_picture,profile_picture_class,data['user_id']))
                            response['msg_response']='El usuario ha sido actualizado.'
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
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info = sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/getUserTable', methods=['GET','POST'])
@is_logged_in
def getUserTable():
    #obtener los usuarios del espacio de trabajo correspondiente
    #no requiere validación de permisos
    response={}
    try:
        if request.method=='POST':
            if int(request.form['workspace_id'])==-1:
                workspace=""
            else:
                workspace=" and workspace_id=%s"%int(request.form['workspace_id'])
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
                    enabled=True %s
                    order by name
                offset %s limit %s
            """%(workspace,int(request.form['start']),int(request.form['length']))).dictresult()
            for u in users:
                u['profile_picture']='<img class="%s user-topnavbar-size"  alt=""/>'%u['profile_picture_class']
            users_count=db.query("""
                select count(*)
                from system.user
                where enabled=True %s
            """%workspace).dictresult()
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
    #obtener lista de usuarios disponibles para agregar a un proyecto
    #no requiere validación de permisos
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                if int(data['workspace_id'])==-1:
                    workspace=""
                else:
                    workspace=" where workspace_id=%s "%data['workspace_id']
                users=db.query("""
                    select user_id, name
                    from system.user %s
                    order by name asc
                """%workspace).dictresult()
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

@bp.route('/getAccountInfo', methods=['GET','POST'])
@is_logged_in
def getAccountInfo():
    #obtener la información de la cuenta del usuario de la sesión
    #no requiere validación de permisos
    response={}
    try:
        valid,data=GF.getDict(request.form,'post')
        if valid:
            user=db.query("""
                select user_id, name, email, profile_picture_class
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

@bp.route('/removeProfileImage', methods=['GET','POST'])
@is_logged_in
def removeProfileImage():
    #quitar la imagen de perfil del usuario y reemplazarla por la imagen genérica
    #no requiere validación de permisos
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                #se obtiene nombre de la clase de acuerdo al usuario
                selector=db.query("""
                    select profile_picture_class, profile_picture
                    from system.user where user_id=%s
                """%data['user_id']).dictresult()[0]
                #se obtiene la hoja de estilos
                sheet=cssutils.parseFile(cfg.profile_css_file)
                #variable para llevar cuenta del índice en el for
                indexcount=0
                #iterar reglas de la hoja de estilos
                for x in sheet.cssRules:
                    #se compara el selector con el nombre de la clase del usuario
                    if x.selectorText=='.%s'%selector['profile_picture_class']:
                        #asigna índice a variable index
                        index=indexcount
                        break
                    else:
                        #si no es el índica que busca, incrementa el número
                        indexcount+=1
                #se borra el índice
                sheet.deleteRule(index)
                #se reescribe la hoja de estilos
                with open(cfg.profile_css_file, "w") as f:
                    f.write(sheet.cssText)

                #path donde se encuentra la imagen
                img_file=os.path.join(cfg.profile_img_path,selector['profile_picture'])
                #verifica si existe archivo de la imagen
                if os.path.exists(img_file):
                    #elimina el archivo de la imagen
                    os.remove(img_file)


                db.query("""
                    update system.user
                    set profile_picture_class='generic-user-img'
                    where user_id=%s
                """%data['user_id'])
                response['success']=True
                response['msg_response']='La imagen de perfil ha sido retirada.'
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar obtener la información del usuario.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/addProjectUser',methods=['GET','POST'])
@is_logged_in
def addProjectUser():
    #agregar un usuario a un proyecto
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['this_user'],'permission':'create_users'})
                if success:
                    if allowed:
                        exists=db.query("""
                            select count(*) from project.project_users
                            where user_id=%s and project_id=%s
                        """%(data['user_id'],data['project_id'])).dictresult()
                        if exists[0]['count']==0:
                            #agregar usuario
                            db.insert('project.project_users',data)
                            notif_info={'project_id':data['project_id'],'user_id':data['user_id'],'form_id':-1}
                            GF.createNotification('add_user_to_project',notif_info)
                            response['success']=True
                            response['msg_response']='Usuario agregado.'
                        else:
                            response['success']=False
                            response['msg_response']='El usuario ya se encuentra agregado al proyecto.'
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

@bp.route('/getProjectUsers', methods=['GET','POST'])
@is_logged_in
def getProjectUsers():
    #obtener los usuarios que se encuentran agregados al proyecto
    #no requiere validación de permisos
    response={}
    try:
        if request.method=='POST':
            project_id=int(request.form['project_id'])
            start=int(request.form['start'])
            offset=int(request.form['length'])

            users=db.query("""
                select
                    a.user_id,
                    a.name,
                    a.profile_picture_class
                from
                    system.user a,
                    project.project_users b
                where
                    a.enabled=True
                and a.user_id=b.user_id
                and b.project_id=%s
                order by a.name
                offset %s limit %s
            """%(project_id, start, offset)).dictresult()

            for u in users:
                u['profile_picture']='<img class="%s user-topnavbar-size"  alt=""/>'%u['profile_picture_class']

            users_count=db.query("""
                select count(b.*)
                from
                    system.user a,
                    project.project_users b
                where
                    a.enabled=True
                and a.user_id=b.user_id
                and b.project_id=%s
            """%project_id).dictresult()

            response['data']=users
            response['recordsTotal']=users_count[0]['count']
            response['recordsFiltered']=users_count[0]['count']
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
    return json.dumps(response)

@bp.route('/getProjectUserPermits', methods=['GET','POST'])
@is_logged_in
def getProjectUserPermits():
    #obtiene los permisos que tiene asignados el usuario
    #no requiere validación de permisos
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                permits=db.query("""
                    select
                        resolve_forms,
                        create_forms,
                        create_projects,
                        create_folders,
                        download_forms,
                        create_users,
                        see_all_forms,
                        delete_foldersandforms
                    from
                        system.user
                    where
                        user_id=%s
                """%data['user_id']).dictresult()[0]
                p="<ul>"

                if permits['resolve_forms']==True:
                    p+='<li>Resolver formularios</li>'
                if permits['create_forms']==True:
                    p+='<li>Crear formularios</li>'
                if permits['create_projects']==True:
                    p+='<li>Crear proyectos</li>'
                if permits['create_folders']==True:
                    p+='<li>Crear carpetas</li>'
                if permits['download_forms']==True:
                    p+='<li>Descargar formularios</li>'
                if permits['create_users']==True:
                    p+='<li>Crear usuarios</li>'
                if permits['see_all_forms']==True:
                    p+='<li>Ver todos los formularios</li>'
                if permits['delete_foldersandforms']==True:
                    p+='<li>Eliminar carpetas/formularios</li>'
                p+='</ul>'
                response['success']=True
                response['data']=p
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

@bp.route('/getUserPermits', methods=['GET','POST'])
@is_logged_in
def getUserPermits():
    #obtiene los permisos del usuario, para poder editarlos
    #no requiere validación de permisos
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                permits=db.query("""
                    select
                        resolve_forms,
                        create_forms,
                        create_projects,
                        create_folders,
                        download_forms,
                        create_users,
                        see_all_forms,
                        delete_foldersandforms
                    from
                        system.user
                    where user_id=%s
                """%data['user_id']).dictresult()
                response['data']=permits[0]
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

@bp.route('/editUser', methods=['GET','POST'])
@is_logged_in
def editUser():
    #editar datos de un usuario
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['this_user'],'permission':'create_users'})
                if success:
                    if allowed:
                        data['name']=data['name'].encode('utf-8')
                        db.query("""
                            update system.user
                            set name='{name}',
                            email='{email}',
                            resolve_forms={resolve_forms},
                            create_forms={create_forms},
                            create_projects={create_projects},
                            create_folders={create_folders},
                            download_forms={download_forms},
                            create_users={create_users},
                            see_all_forms={see_all_forms},
                            delete_foldersandforms={delete_foldersandforms}
                            where user_id={user_id}
                        """.format(**data))
                        response['success']=True
                        response['msg_response']='El usuario ha sido actualizado.'
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

@bp.route('/removeProjectUser', methods=['GET','POST'])
@is_logged_in
def removeProjectUser():
    response={}
    try:
        if request.method=='POST':
            response['success']=False
            valid,data=GF.getDict(request.form,'post')
            if valid:
                success,allowed=GF.checkPermission({'user_id':data['user_id'],'permission':'create_users'})
                if success:
                    if allowed:
                        manager=db.query("""
                            select manager,partner from project.project where project_id=%s
                        """%data['project_id']).dictresult()[0]
                        if int(manager['manager'])!=int(data['remove_user']) and int(manager['partner'])!=int(data['remove_user']):
                            forms=db.query("""
                                select count(*) from project.form where assigned_to=%s and project_id=%s
                            """%(data['remove_user'],data['project_id'])).dictresult()
                            if forms[0]['count']==0:
                                revisions=db.query("""
                                    select count(a.*) from project.form_revisions a, project.form b
                                    where a.form_id=b.form_id and b.project_id=%s and a.user_id=%s
                                """%(data['project_id'],data['remove_user'])).dictresult()
                                if revisions[0]['count']==0:
                                    db.query("""
                                        delete from project.project_users where project_id=%s and user_id=%s
                                    """%(data['project_id'],data['remove_user']))
                                    response['success']=True
                                    response['msg_response']='El usuario ha sido eliminado del proyecto.'
                                else:
                                    response['msg_response']='El usuario no puede ser eliminado, porque se encuentra como revisor de al menos un formulario.'
                            else:
                                response['msg_response']='El usuario no puede ser eliminado, porque tiene al menos un formulario asignado.'
                        else:
                            if int(manager['manager'])==int(data['remove_user']):
                                response['msg_response']='El usuario no puede ser eliminado, porque ha sido asignado como gerente en este proyecto.'
                            else:
                                response['msg_response']='El usuario no puede ser eliminado, porque ha sido asignado como socio en este proyecto.'
                    else:
                        response['msg_response']='No tienes permisos para realizar esta acción.'
                else:
                    response['msg_response']='Ocurrió un error al intentar validar los datos, favor de intentarlo de nuevo.'
            else:
                response['msg_response']='Ocurrió un error al intentar obtener los datos, favor de intentarlo más tarde.'
        else:
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)
