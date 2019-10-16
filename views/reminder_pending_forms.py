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
        forms=db.query("""
            select  b.form_id, b.name, b.project_id, (select a.email from system.user a where a.user_id=b.assigned_to) assigned_mail, to_char(b.resolve_before,'DD/MM/YYYY') as resolve_before, to_char(b.resolved_date,'DD/MM/YYYY') as resolved_date from project.form b
            where b.status_id in (3,4)
        """).dictresult()

        template='<p style="text-align: center;"><img src="{top_img}" alt="" width="50" height="50" /></p><p style="text-align: center;">&nbsp;</p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Estimado usuario:</span></p><p>&nbsp;</p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">No olvides que tienes pendiente por resolver el formulario <em>{name}</em>, deber&aacute; ser terminado a m&aacute;s tardar el {resolve_before}.</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Puede acceder al formulario a trav&eacute;s del siguiente {link}.</span></p><p><img src="{bottom_img}" alt="" width="250" height="70" /></p>'
        for f in forms:
            f['top_img']=cfg.img_form_reminder
            f['bottom_img']=cfg.img_rb_logo
            link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(f['project_id'])),str(f['form_id']))
            f['link']='<a href="%s"> link</a>'%link
            subject='Recordatorio: Cuestionario pendiente'
            body=template.format(**f)
            recipients=[f['assigned_mail']]
            MF.sendMail(subject,body,recipients)

        logger.info("Termina formularios pendientes")

    except:
        exc_info = sys.exc_info()
        logger.error(traceback.format_exc(exc_info))

if __name__ == '__main__':
    main()
