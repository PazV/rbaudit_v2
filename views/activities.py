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
import datetime
from .db_connection import getDB
db = getDB()
from flask import current_app as app
import app_config as cfg
from . import general_functions
GF = general_functions.GeneralFunctions()

bp = Blueprint('activities', __name__, url_prefix='/activity-list')

@bp.route('/')
@is_logged_in
def activityList():
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
    return render_template('activity_list.html',g=g)

@bp.route('/getUserActivities',methods=['GET','POST'])
@is_logged_in
def getUserActivities():
    #obtener las actividades pendientes del usuario
    response={}
    try:
        if request.method=='POST':

            user_id=int(request.form['user_id'])
            # user_id=24
            # date=request.form['date']
            filters=request.form['filters']
            filter_list=json.loads(filters)
            start=int(request.form['start'])
            limit=int(request.form['length'])


            filter_str=''
            company=''
            project=''
            form=''
            status=[]
            date_from=[]
            date_to=[]
            priority=[]
            if filter_list!=[]:
                for x in filter_list:
                    if x['field']=='company_name':
                        if company=='':
                            company+=" c.company_name ilike '%%%s%%' "%x['value']
                        else:
                            company+=" or c.company_name ilike '%%%s%%' "%x['value']
                    elif x['field']=='project_name':
                        if project=='':
                            project+=" c.name ilike '%%%s%%' "%x['value']
                        else:
                            project+=" or c.name ilike '%%%s%%' "%x['value']
                    elif x['field']=='form_name':
                        if form=='':
                            form+=" a.name ilike '%%%s%%'"%x['value']
                        else:
                            form+=" or a.name ilike '%%%s%%'"%x['value']
                    elif x['field']=='status':
                        status.append(x['value'])
                    elif x['field']=='resolve_before':
                        date_from.append(x['value'].split(',')[0])
                        date_to.append(x['value'].split(',')[1])
                    elif x['field']=='priority':
                        priority.append(x['value'])

                if company!='':
                    filter_str+=' and (%s) '%company
                if project!='':
                    filter_str+=' and (%s) '%project
                if form!='':
                    filter_str+=' and (%s) '%form
                if status!=[]:
                    status_str=','.join(str(e) for e in status)
                    filter_str+=' and a.status_id in (%s)'%status_str
                if priority!=[]:
                    priority_str=''
                    for p in priority:
                        if priority_str!='':
                            priority_str+=' or '
                        if p=='red':
                            priority_str+=' a.resolve_before <= current_date '
                        elif p=='orange':
                            priority_str+=" a.resolve_before between current_date and current_date + interval '3 days' "
                        elif p=='yellow':
                            priority_str+=" a.resolve_before > current_date + interval '3 days' "
                    filter_str+=' and (%s)'%priority_str

                if date_from!=[] and date_to!=[]:
                    date_from_str=''
                    date_to_str=''
                    if date_from!=[]:
                        new_date_from=[]
                        for df in date_from:
                            new_date_from.append(datetime.datetime.strptime(df,'%Y-%m-%d'))
                        min_date=min(new_date_from)
                        date_from_str=min_date.strftime('%Y-%m-%d')
                    else:
                        date_from_str=datetime.datetime.now().strftime('%Y-%m-%d')
                    if date_to!=[]:
                        new_date_to=[]
                        for dt in date_to:
                            new_date_to.append(datetime.datetime.strptime(dt,'%Y-%m-%d'))
                        max_date=max(new_date_to)
                        date_to_str=max_date.strftime('%Y-%m-%d')
                    else:
                        date_to_str=datetime.datetime.now().strftime('%Y-%m-%d')

                    filter_str+=" and a.resolve_before between '%s' and '%s'"%(date_from_str,date_to_str)


            forms=db.query("""
                select a.form_id, a.project_id, a.name as form_name, to_char(a.resolve_before, 'DD/MM/YYYY') as resolve_before,
                c.name,
                c.company_name,
                case when a.resolve_before between current_date and current_date + interval '3 days' then 'act-priority-orange' when a.resolve_before < current_date then 'act-priority-red' when a.resolve_before > current_date + interval '3 days' then 'act-priority-yellow' end as priority_class,
                case when b.status = 'Publicado' then 'Sin iniciar' else b.status end as status
                from project.form a, project.form_status b, project.project c
                where a.project_id in (select project_id from project.project where (manager=%s or partner=%s or assigned_to=%s or %s in (select c.user_id from project.form_revisions c where c.form_id=a.form_id))
                --and now() >= start_date and now() <= finish_date
                )
                and a.project_id=c.project_id and a.status_id=b.status_id
                and a.status_id in (3,4,5,6)
                %s
                --order by expired desc, a.resolve_before asc
                offset %s limit %s
            """%(user_id,user_id,user_id,user_id,filter_str,start,limit)).dictresult()
            #--and resolve_before < '%s'

            # app.logger.info("""
            #     select a.form_id, a.project_id, a.name as form_name, to_char(a.resolve_before, 'DD/MM/YYYY') as resolve_before,
            #     c.name,
            #     c.company_name,
            #     case when a.resolve_before between current_date and current_date + interval '3 days' then 'act-priority-orange' when a.resolve_before < current_date then 'act-priority-red' when a.resolve_before > current_date + interval '3 days' then 'act-priority-yellow' end as priority_class,
            #     case when b.status = 'Publicado' then 'Sin iniciar' else b.status end as status
            #     from project.form a, project.form_status b, project.project c
            #     where a.project_id in (select project_id from project.project where (manager=%s or partner=%s or assigned_to=%s or %s in (select c.user_id from project.form_revisions c where c.form_id=a.form_id))
            #     --and now() >= start_date and now() <= finish_date
            #     )
            #     and a.project_id=c.project_id and a.status_id=b.status_id
            #     and a.status_id in (3,4,5,6)
            #     %s
            #     --order by expired desc, a.resolve_before asc
            #     offset %s limit %s
            # """%(user_id,user_id,user_id,user_id,filter_str,start,limit))

            form_count=db.query("""
                select count(a.form_id)
                from project.form a, project.form_status b, project.project c
                where a.project_id in (select project_id from project.project where (manager=%s or partner=%s or assigned_to=%s or %s in (select c.user_id from project.form_revisions c where c.form_id=a.form_id))
                --and now() >= start_date and now() <= finish_date
                ) and a.project_id=c.project_id and a.status_id=b.status_id
                and a.status_id in (3,4,5,6) %s

            """%(user_id,user_id,user_id,user_id,filter_str)).dictresult()
            #--and resolve_before <= '%s'

            for f in forms:
                # f['form_name']='<div class="%s"><div class="spn-act-priority">%s</div></div>'%(f['priority_class'],f['form_name'])
                # f['company_name']='<div class="%s"><div class="spn-act-priority">%s</div></div>'%(f['priority_class'],f['company_name'])
                f['priority_class']='<div class="%s"></div>'%f['priority_class']
                link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(f['project_id'])),str(f['form_id']))
                f['link']='<a href="%s" target="_blank"><i class="fa fa-external-link"></i></a>'%link

            response['data']=forms
            response['success']=True
            response['recordsTotal']=form_count[0]['count']
            response['recordsFiltered']=form_count[0]['count']

        else:
            response['success']=False
            response['msg_response']='Ocurrió un error al intentar procesar la información, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
        GF.sendErrorMail(traceback.format_exc(exc_info))
    return json.dumps(response)
