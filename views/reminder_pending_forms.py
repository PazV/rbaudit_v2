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


print "Entra formularios pendientes"
# create logger with 'spam_application'
logger = logging.getLogger('Send Notif')
logger.setLevel(logging.DEBUG)
# create file handler which logs even debug messages
fh = logging.FileHandler('%scron_pending_forms.log'%cfg.log_path)
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
        #forms pendientes por resolver que aún no pasan la fecha de vencimiento
        #se envía a usuario asignado
        forms_non_expired=db.query("""
            select  b.form_id, b.name, b.project_id, (select a.email from system.user a where a.user_id=b.assigned_to) as assigned_mail, to_char(b.resolve_before,'DD/MM/YYYY') as resolve_before, to_char(b.resolved_date,'DD/MM/YYYY') as resolved_date from project.form b
            where b.status_id in (3,4) and b.resolve_before >=now()
        """).dictresult()

        template='<p style="text-align: center;"><img src="{top_img}" alt="" width="70" height="70" /></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Estimado usuario:</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">No olvides que tienes pendiente por resolver el formulario <em>{name}</em>, deber&aacute; ser terminado a m&aacute;s tardar el {resolve_before}.</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Puedes acceder al formulario a trav&eacute;s del siguiente {link}.</span></p><p><img src="{bottom_img}" alt="" width="250" height="70" /></p>'

        if forms_non_expired!=[]:
            for fne in forms_non_expired:
                fne['top_img']=cfg.img_form_reminder
                fne['bottom_img']=cfg.img_rb_logo
                link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(fne['project_id'])),str(fne['form_id']))
                fne['link']='<a href="%s"> link</a>'%link
                subject='Recordatorio: Cuestionario pendiente'
                body=template.format(**fne)
                recipients=[fne['assigned_mail']]
                MF.sendMail(subject,body,recipients)

        logger.info("Termina formularios pendientes que no ha pasado su fecha de vencimiento a elaborador")
        print "Termina formularios pendientes que no ha pasado su fecha de vencimiento a elaborador"

        #forms que faltan 3 días para que expire
        #se envía a primer revisor
        forms_about_expire=db.query("""
            select  b.form_id, b.name, b.project_id, (select a.name from system.user a where a.user_id=b.assigned_to) as assignee_name, to_char(b.resolve_before,'DD/MM/YYYY') as resolve_before, to_char(b.resolved_date,'DD/MM/YYYY') as resolved_date from project.form b
            where b.status_id in (3,4) and resolve_before between now()  and  now() + interval '3 days' ;
        """).dictresult()
        template='<p style="text-align: center;"><img src="{top_img}" alt="" width="70" height="70"></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Estimado usuario:</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Te recordamos que {assignee_name} tiene pendiente por resolver el formulario <em>{name}</em>, deber&aacute; ser terminado a m&aacute;s tardar el {resolve_before}.</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Puedes acceder al formulario a trav&eacute;s del siguiente {link}.</span></p><p><img src="{bottom_img}" alt="" width="250" height="70"></p><p><br></p>'
        if forms_about_expire!=[]:
            for fae in forms_about_expire:
                send_to=db.query("""
                    select a.email from system.user a, project.form_revisions b where b.form_id=%s and b.revision_number=1 and a.user_id=b.user_id
                """%fae['form_id']).dictresult()[0]['email']
                fae['top_img']=cfg.img_form_reminder
                fae['bottom_img']=cfg.img_rb_logo
                link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(fae['project_id'])),str(fae['form_id']))
                fae['link']='<a href="%s"> link</a>'%link
                subject='Recordatorio: Cuestionario pendiente'
                body=template.format(**fae)
                recipients=[send_to]
                MF.sendMail(subject,body,recipients)
        logger.info("Termina formularios pendientes que no ha pasado su fecha de vencimiento a revisor")
        print "Termina formularios pendientes que no ha pasado su fecha de vencimiento a revisor"

        #forms que ya pasaron su fecha de vencimiento
        #se envía a usuario asignado
        forms_expired=db.query("""
            select  b.form_id, b.name, b.project_id, (select a.email from system.user a where a.user_id=b.assigned_to) as assigned_mail, (select a.name from system.user a where a.user_id=b.assigned_to) as assignee_name, to_char(b.resolve_before,'DD/MM/YYYY') as resolve_before, to_char(b.resolved_date,'DD/MM/YYYY') as resolved_date from project.form b
            where b.status_id in (3,4) and b.resolve_before < now()
        """).dictresult()

        template='<p style="text-align: center;"><img src="{top_img}" alt="" width="70" height="70"></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Estimado usuario:</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">No olvides que tienes pendiente por resolver el formulario <em>{name}</em>, debi&oacute; ser terminado antes del <strong>{resolve_before}.</strong></span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Puedes acceder al formulario a trav&eacute;s del siguiente {link}.</span></p><p><img src="{bottom_img}" alt="" width="250" height="70"></p>'

        template_reviewer='<p style="text-align: center;"><img src="{top_img}" alt="" width="70" height="70"></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Estimado usuario:</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Te recordamos que {assignee_name} tiene pendiente por resolver el formulario <em>{name}</em>, debi&oacute; ser terminado antes del <strong>{resolve_before}.</strong></span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Puedes acceder al formulario a trav&eacute;s del siguiente {link}.</span></p><p><img src="{bottom_img}" alt="" width="250" height="70"></p><p><br></p>'

        if forms_expired!=[]:
            for fe in forms_expired:
                fe['top_img']=cfg.img_form_expired
                fe['bottom_img']=cfg.img_rb_logo
                link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(fe['project_id'])),str(fe['form_id']))
                fe['link']='<a href="%s"> link</a>'%link
                subject='Recordatorio: Cuestionario pendiente (vencido)'
                body=template.format(**fe)
                recipients=[fe['assigned_mail']]
                MF.sendMail(subject,body,recipients)

                reviewer=db.query("""
                    select a.email from system.user a, project.form_revisions b where b.form_id=%s and b.revision_number=1 and a.user_id=b.user_id
                """%fe['form_id']).dictresult()[0]['email']
                body=template_reviewer.format(**fe)
                recipients=[reviewer]
                MF.sendMail(subject,body,recipients)

        logger.info("Termina formularios pendientes que ya pasaron su fecha de vencimiento elaborador y revisor")
        print "Termina formularios pendientes que ya pasaron su fecha de vencimiento elaborador y revisor"



    except:
        exc_info = sys.exc_info()
        logger.error(traceback.format_exc(exc_info))

if __name__ == '__main__':
    main()
