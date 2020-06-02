#!/usr/bin/env python
#--*-- coding: utf-8 --*--
from db_connection import getDB
db = getDB()
import os
import logging
import app_config as cfg
import sys
import traceback
import datetime
from dateutil.relativedelta import relativedelta
import smtplib
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText
import re


print "Entra reporte por proyecto"
# create logger with 'spam_application'
logger = logging.getLogger('Send Notif')
logger.setLevel(logging.DEBUG)
# create file handler which logs even debug messages
fh = logging.FileHandler('%scron_report_by_project.log'%cfg.log_path)
fh.setLevel(logging.DEBUG)
# create console handler with a higher log level
ch = logging.StreamHandler()
ch.setLevel(logging.ERROR)
# create formatter and add it to the handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
ch.setFormatter(formatter)
# add the handlers to the logger
if not len(logger.handlers):
    logger.addHandler(fh)
    logger.addHandler(ch)

logger.info("Log info")

class MailFunctions:
    def sendMail(self,subject,body,to_address):
        response={}
        try:
            server=smtplib.SMTP(cfg.mail_server,cfg.mail_port)
            server.login(cfg.mail_username,cfg.mail_password)
            from_address=cfg.mail_username
            msg=MIMEMultipart()
            msg['From']=from_address
            if type(to_address)==list:
                msg['To']=','.join(to_address)
                to_address.append(cfg.app_admin_mail)
                list_to=to_address
            else:
                msg['To']=to_address
                list_to=[to_address,cfg.app_admin_mail]
            # msg['To']="%s, %s"%(to_address,cfg.app_admin_mail)
            msg['Subject']=subject.decode('utf-8')
            body=self.replaceStringHtml(body)
            msg.attach(MIMEText(body,'html'))
            text=msg.as_string()

            resp=server.sendmail(from_address,list_to,text)
            logger.info(resp)
            logger.info("sends mail")
            response['success']=True
        except:
            exc_info=sys.exc_info()
            logger.info(traceback.format_exc(exc_info))
            response['success']=False
        return response

    def replaceStringHtml(self,text):
        rep = {
            "á":"&aacute;",
            "é":"&eacute;",
            "í":"&iacute;",
            "ó":"&oacute;",
            "ú":"&uacute;",
            "Á":"&Aacute;",
            "É":"&Eacute;",
            "Í":"&Iacute;",
            "Ó":"&Oacute;",
            "Ú":"&Uacute;",
            "ñ":"&ntilde;",
            "Ñ":"&Ntilde;"
        }
        rep = dict((re.escape(k), v) for k, v in rep.iteritems())
        pattern = re.compile("|".join(rep.keys()))
        new_text = pattern.sub(lambda m: rep[re.escape(m.group(0))], text)
        return new_text

def main():
    try:
        MF=MailFunctions()

        #obtener usuarios habilitados
        users=db.query("""
            select user_id, name, email
            from system.user
            where enabled=True order by user_id
        """).dictresult()

        #recorrer usuarios para obtener proyectos donde es gerente o supervisor
        for u in users:
            logger.info("Procesando usuario %s"%u['name'])
            template=''
            projects=db.query("""
                select project_id, name as project_name,
                company_name, to_char(start_date,'DD/MM/YYYY') as project_start_date,
                to_char(finish_date,'DD/MM/YYYY') as project_finish_date,
                (select a.name from system.user a where a.user_id=manager) as supervisor_name,
                (select a.name from system.user a where a.user_id=partner) as manager_name
                from project.project
                where (manager=%s or partner=%s) and now() >= start_date and now() <= finish_date
            """%(u['user_id'],u['user_id'])).dictresult()
            count_projects=db.query("""
                select count(*) from project.project
                where (manager=%s or partner=%s) and now() >= start_date and now() <= finish_date
            """%(u['user_id'],u['user_id'])).dictresult()
            logger.info("Total proyectos: %s"%count_projects[0]['count'])
            if projects!=[]:
                for p in projects:
                    logger.info("Procesando proyecto %s - %s"%(p['project_name'],p['project_id']))
                    #verifica si el proyecto tiene formularios
                    exists_forms=db.query("""
                        select count(*) from project.form
                        where project_id=%s and status_id not in (1,2)
                    """%p['project_id']).dictresult()
                    if exists_forms[0]['count']!=0:

                        #formularios publicados
                        forms_published=db.query("""
                            select form_id,
                            name as form_name,
                            to_char(resolve_before, 'DD/MM/YYYY') as resolve_before,
                            --case when resolve_before>current_date then '1' when resolve_before<current_date then '3' when resolve_before=current_date then '2'  end as expired,
                            case when resolve_before between current_date and current_date + interval '3 days' then '2' when resolve_before < current_date then '3' when resolve_before > current_date + interval '3 days' then '1' end as expired,
                            (select a.name from system.user a where a.user_id = assigned_to) as assignee_name,
                            case when resolve_before between current_date and current_date + interval '3 days' then 'orange' when resolve_before < current_date then 'red' when resolve_before > current_date + interval '3 days' then 'yellow' end as flag
                            from project.form where status_id=3
                            and project_id=%s
                            order by expired desc, resolve_before asc
                        """%p['project_id']).dictresult()

                        forms_resolving=db.query("""
                            select form_id,
                            name as form_name,
                            to_char(resolve_before, 'DD/MM/YYYY') as resolve_before,
                            case when resolve_before between current_date and current_date + interval '3 days' then '2' when resolve_before < current_date then '3' when resolve_before > current_date + interval '3 days' then '1' end as expired,
                            --case when resolve_before>current_date then '1' when resolve_before<current_date then '3' when resolve_before=current_date then '2'  end as expired,
                            (select a.name from system.user a where a.user_id = assigned_to) as assignee_name,
                            case when resolve_before between current_date and current_date + interval '3 days' then 'orange' when resolve_before < current_date then 'red' when resolve_before > current_date + interval '3 days' then 'yellow' end as flag
                            from project.form where status_id=4
                            and project_id=%s
                            order by expired desc, resolve_before asc
                        """%p['project_id']).dictresult()

                        forms_revising=db.query("""
                            select a.form_id,
                            a.name as form_name,
                            to_char(a.resolve_before, 'DD/MM/YYYY') as resolve_before,
                            --case when a.resolve_before>current_date then '1' when a.resolve_before<current_date then '3' when a.resolve_before=current_date then '2'  end as expired,
                            case when resolve_before between current_date and current_date + interval '3 days' then '2' when resolve_before < current_date then '3' when resolve_before > current_date + interval '3 days' then '1' end as expired,
                            (select b.name from system.user b where b.user_id = assigned_to) as assignee_name,
                            case when a.resolve_before between current_date and current_date + interval '3 days' then 'orange' when a.resolve_before < current_date then 'red' when a.resolve_before > current_date + interval '3 days' then 'yellow' end as flag,
                            (select b.name from system.user b, project.form_revisions c where b.user_id=c.user_id and c.currently_assigned=True and c.form_id=a.form_id) as revisor_name
                            from project.form a where a.status_id in (5,6)
                            and a.project_id=%s
                            order by expired desc, resolve_before asc
                        """%p['project_id']).dictresult()

                        forms_closed=db.query("""
                            select form_id,
                            name as form_name,
                            to_char(resolve_before, 'DD/MM/YYYY') as resolve_before,
                            case when resolve_before>current_date then '1' when resolve_before<current_date then '3' when resolve_before=current_date then '2'  end as expired,
                            (select a.name from system.user a where a.user_id = assigned_to) as assignee_name
                            from project.form where status_id = 7
                            and project_id=%s
                            order by form_name asc
                        """%p['project_id']).dictresult()

                        forms_uploaded=db.query("""
                            select form_id, name as form_name
                            from project.form where status_id=2
                            and project_id=%s
                        """%p['project_id']).dictresult()

                        template+='<p style="line-height: 0;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Proyecto: <strong>{project_name}&nbsp;</strong></span></p><p style="line-height: 0;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Empresa: {company_name}</span></p><p style="line-height: 0;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Inicia: {project_start_date} finaliza: {project_finish_date}</span></p><p style="line-height: 0;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Supervisor: {supervisor_name}</span></p><p style="line-height: 0;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Gerente: {manager_name}</span></p>'
                        template=template.format(**p)

                        if forms_published!=[]:
                            template+='<p style="line-height: 1;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Actividades con estatus <em><strong>publicada</strong></em>:</span></p>'
                            for fp in forms_published:
                                if fp['flag']=='red':
                                    fp['flag']=cfg.img_red_flag
                                elif fp['flag']=='orange':
                                    fp['flag']=cfg.img_orange_flag
                                else:
                                    fp['flag']=cfg.img_yellow_flag
                                template+='<p style="line-height: 1; margin-left: 20px;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;"><img src="{flag}" style="height:12px; width:12px;"> {form_name} - asignada a {assignee_name}, fecha de vencimiento: {resolve_before}, {link}</span></p>'
                                link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(p['project_id'])),str(fp['form_id']))
                                fp['link']='<a href="%s"> Acceder</a>'%link
                                template=template.format(**fp)
                        if forms_resolving!=[]:
                            template+='<p><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Actividades con estatus <em><strong>resolviendo:</strong></em></span></p>'
                            for fr in forms_resolving:
                                if fr['flag']=='red':
                                    fr['flag']=cfg.img_red_flag
                                elif fr['flag']=='orange':
                                    fr['flag']=cfg.img_orange_flag
                                else:
                                    fr['flag']=cfg.img_yellow_flag
                                template+='<p style="line-height: 1; margin-left: 20px;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;"><img src="{flag}" style="height:12px; width:12px;"> {form_name} - asignada a {assignee_name}, fecha de vencimiento: {resolve_before}, {link}</span></p>'
                                link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(p['project_id'])),str(fr['form_id']))
                                fr['link']='<a href="%s"> Acceder</a>'%link
                                template=template.format(**fr)
                        if forms_revising!=[]:
                            template+='<p style="line-height: 1;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Actividades con estatus <em><strong>revisando:</strong></em></span></p>'
                            for fre in forms_revising:
                                if fre['flag']=='red':
                                    fre['flag']=cfg.img_red_flag
                                elif fre['flag']=='orange':
                                    fre['flag']=cfg.img_orange_flag
                                else:
                                    fre['flag']=cfg.img_yellow_flag
                                template+='<p style="line-height: 1; margin-left: 20px;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;"><img src="{flag}" style="height:12px; width:12px;"> {form_name} - asignada a {assignee_name}, revisando por {revisor_name}, fecha de vencimiento: {resolve_before}, {link}</span></p>'
                                link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(p['project_id'])),str(fre['form_id']))
                                fre['link']='<a href="%s"> Acceder</a>'%link
                                template=template.format(**fre)
                        if forms_closed!=[]:
                            template+='<p><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Actividades con estatus <em><strong>cerrada:</strong></em></span></p>'
                            for fc in forms_closed:
                                template+='<p style="line-height: 1; margin-left: 20px;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">{form_name} - asignada a {assignee_name}, fecha de vencimiento: {resolve_before}, {link}</span></p>'
                                link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(p['project_id'])),str(fc['form_id']))
                                fc['link']='<a href="%s"> Acceder</a>'%link
                                template=template.format(**fc)

                        # if forms_uploaded!=[]:
                        #     template+='<p style="line-height: 1;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Actividades cargadas, pendientes por publicar:</span></p><ul style="margin-left: 20px ">'
                        #     for fu in forms_uploaded:
                        #         template+='<li style="line-height: 1;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">{form_name}</span></li>'.format(**fu)
                        #     template+='</ul>'
                        template+='<hr>'

                if template!='':
                    template+='<p><img src="%s" alt="" width="250" height="70"></p><p><br></p>'%cfg.img_rb_logo
                    subject='Resumen de actividades'
                    body='<p style="line-height: 1;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Estimado usuario:</span></p><p style="line-height: 1;"><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">A continuaci&oacute;n mostramos un resumen de los proyectos supervisados por usted:</span></p>'+template
                    recipients=[u['email']]
                    MF.sendMail(subject,body,recipients)
                    logger.info("Envía correo de usuario %s"%u['name'])
                else:
                    print "Usuario %s sin formularios"%u['name']
                    logger.info("Usuario %s sin formularios"%u['name'])



    except:
        exc_info = sys.exc_info()
        logger.error(traceback.format_exc(exc_info))

if __name__ == '__main__':
    main()
