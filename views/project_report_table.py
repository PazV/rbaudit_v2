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

print "Entra reporte por proyecto tabla"
# create logger with 'spam_application'
logger = logging.getLogger('Send Notif')
logger.setLevel(logging.DEBUG)
# create file handler which logs even debug messages
fh = logging.FileHandler('%scron_project_report_table.log'%cfg.log_path)
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
            where enabled=True and workspace_id <>4 order by user_id
        """).dictresult()

        #recorrer usuarios para obtener proyectos donde es gerente o supervisor
        for u in users:
            logger.info("Procesando usuario %s"%u['name'])
            template=''

            forms=db.query("""
                select a.form_id, a.project_id, a.name as form_name, to_char(a.resolve_before, 'DD/MM/YYYY') as resolve_before,
                c.name || ' - ' || c.company_name as project_name,
                case when a.resolve_before between current_date and current_date + interval '3 days' then '2' when a.resolve_before < current_date then '3' when a.resolve_before > current_date + interval '3 days' then '1' end as expired,
                case when b.status = 'Publicado' then 'Sin iniciar' else b.status end as status
                from project.form a, project.form_status b, project.project c
                where a.project_id in (select project_id from project.project where (manager=%s or partner=%s or assigned_to=%s or %s in (select c.user_id from project.form_revisions c where c.form_id=a.form_id)) and now() >= start_date and now() <= finish_date) and a.project_id=c.project_id and a.status_id=b.status_id
                and a.status_id in (3,4,5,6) and resolve_before < current_date + interval '30 days'
                order by expired desc, a.resolve_before asc
            """%(u['user_id'],u['user_id'],u['user_id'],u['user_id'])).dictresult()

            if forms!=[]:
                flags={'red_flag':cfg.img_red_flag,'orange_flag':cfg.img_orange_flag,'yellow_flag':cfg.img_yellow_flag}
                template='<p><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Estimado usuario, a continuaci&oacute;n le presentamos un resumen de las actividades supervisadas por usted:</span></p><p><div style="text-align: left;"><img src={red_flag} style="height: 12px; width: 12px;">&nbsp;<span style="font-family: Verdana, Geneva, sans-serif; font-size: 13px;">Vencido&nbsp;&nbsp;&nbsp;</span><img src={orange_flag} style="height: 12px; width: 12px;">&nbsp;<span style="font-family: Verdana, Geneva, sans-serif; font-size: 13px;">Vence hoy o en los siguientes 3 días&nbsp;&nbsp;&nbsp;&nbsp;</span><img src={yellow_flag} style="height: 12px; width: 12px;">&nbsp;<span style="font-family: Verdana, Geneva, sans-serif; font-size: 13px;">Faltan más de 3 días para que venza&nbsp;</span></div></p><table style="width: 100%; color: rgb(37, 37, 37); font-family: Verdana, Geneva, sans-serif; font-size: 14px; border-collapse: collapse; border: 1px solid rgb(173, 173, 173);"><tbody><tr><td style="width: 10.274%; border: 1px solid rgb(173, 173, 173); background-color: rgb(43, 169, 206);"><div style="text-align: center;"><span style="color: rgb(255, 255, 255);">Prioridad</span></div></td><td style="width: 28.2534%; border: 1px solid rgb(173, 173, 173); background-color: rgb(43, 169, 206);"><div style="text-align: center;"><span style="color: rgb(255, 255, 255);">Proyecto</span></div></td><td style="width: 28.2534%; border: 1px solid rgb(173, 173, 173); background-color: rgb(43, 169, 206);"><div style="text-align: center;"><span style="color: rgb(255, 255, 255);">Actividad</span></div></td><td style="width: 13.5274%; border: 1px solid rgb(173, 173, 173); background-color: rgb(43, 169, 206);"><div style="text-align: center;"><span style="color: rgb(255, 255, 255);">Vencimiento</span></div></td><td style="width: 9.9315%; border: 1px solid rgb(173, 173, 173); background-color: rgb(43, 169, 206);"><div style="text-align: center;"><span style="color: rgb(255, 255, 255);">Estado</span></div></td><td style="width: 9.4178%; border: 1px solid rgb(173, 173, 173); background-color: rgb(43, 169, 206);"><div style="text-align: center;"><span style="color: rgb(255, 255, 255);">Acceso directo</span></div></td></tr>'.format(**flags)

                for f in forms:
                    if f['expired']=='3':
                        f['flag']=cfg.img_red_flag
                    elif f['expired']=='2':
                        f['flag']=cfg.img_orange_flag
                    else:
                        f['flag']=cfg.img_yellow_flag
                    link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(f['project_id'])),str(f['form_id']))
                    f['link']='<a href="%s">Ir</a>'%link
                    template+='<tr><td style="width: 10.274%; border: 1px solid rgb(173, 173, 173);"><div style="text-align: center;"><img src={flag} style="height: 12px; width: 12px;"></div></td><td style="width: 28.2534%; border: 1px solid rgb(173, 173, 173);">{project_name}</td><td style="width: 28.2534%; border: 1px solid rgb(173, 173, 173);">{form_name}</td><td style="width: 13.5274%; border: 1px solid rgb(173, 173, 173);"><div style="text-align: center;">{resolve_before}</div></td><td style="width: 9.9315%; border: 1px solid rgb(173, 173, 173);"><div style="text-align: center;">{status}</div></td><td style="width: 9.4178%; border: 1px solid rgb(173, 173, 173);"><div style="text-align: center;">{link}</div></td></tr>'.format(**f)

                template+='</tbody></table><br><p><img src="%s" alt="" width="250" height="70"></p><p><br></p>'%cfg.img_rb_logo
                subject='Resumen de actividades'
                body=template
                recipients=[u['email']]
                MF.sendMail(subject,body,recipients)
                logger.info("Envía correo de usuario %s"%u['name'])
                print "Envía correo de usuario %s"%u['name']
            else:
                print "Usuario %s sin formularios"%u['name']
                logger.info("Usuario %s sin formularios"%u['name'])

        ####usuarios bama
        ###solo lleguen notificaciones a partir de 5 días antes de que se venza la actividad

        #obtener usuarios habilitados
        users_b=db.query("""
            select user_id, name, email
            from system.user
            where enabled=True and workspace_id=4 order by user_id
        """).dictresult()

        #recorrer usuarios para obtener proyectos donde es gerente o supervisor
        for ub in users_b:
            logger.info("Procesando usuario %s"%ub['name'])
            template=''

            forms_b=db.query("""
                select a.form_id, a.project_id, a.name as form_name, to_char(a.resolve_before, 'DD/MM/YYYY') as resolve_before,
                c.name || ' - ' || c.company_name as project_name,
                case when a.resolve_before between current_date and current_date + interval '3 days' then '2' when a.resolve_before < current_date then '3' when a.resolve_before > current_date + interval '3 days' then '1' end as expired,
                case when b.status = 'Publicado' then 'Sin iniciar' else b.status end as status
                from project.form a, project.form_status b, project.project c
                where a.project_id in (select project_id from project.project where (manager=%s or partner=%s or assigned_to=%s or %s in (select c.user_id from project.form_revisions c where c.form_id=a.form_id)) and now() >= start_date and now() <= finish_date) and a.project_id=c.project_id and a.status_id=b.status_id
                and a.status_id in (3,4,5,6) and resolve_before < current_date + interval '5 days'
                order by expired desc, a.resolve_before asc
            """%(ub['user_id'],ub['user_id'],ub['user_id'],ub['user_id'])).dictresult()

            if forms_b!=[]:
                flags={'red_flag':cfg.img_red_flag,'orange_flag':cfg.img_orange_flag,'yellow_flag':cfg.img_yellow_flag}
                template='<p><span style="font-family: Verdana, Geneva, sans-serif; font-size: 14px;">Estimado usuario, a continuaci&oacute;n le presentamos un resumen de las actividades supervisadas por usted:</span></p><p><div style="text-align: left;"><img src={red_flag} style="height: 12px; width: 12px;">&nbsp;<span style="font-family: Verdana, Geneva, sans-serif; font-size: 13px;">Vencido&nbsp;&nbsp;&nbsp;</span><img src={orange_flag} style="height: 12px; width: 12px;">&nbsp;<span style="font-family: Verdana, Geneva, sans-serif; font-size: 13px;">Vence hoy o en los siguientes 3 días&nbsp;&nbsp;&nbsp;&nbsp;</span><img src={yellow_flag} style="height: 12px; width: 12px;">&nbsp;<span style="font-family: Verdana, Geneva, sans-serif; font-size: 13px;">Faltan más de 3 días para que venza&nbsp;</span></div></p><table style="width: 100%; color: rgb(37, 37, 37); font-family: Verdana, Geneva, sans-serif; font-size: 14px; border-collapse: collapse; border: 1px solid rgb(173, 173, 173);"><tbody><tr><td style="width: 10.274%; border: 1px solid rgb(173, 173, 173); background-color: rgb(43, 169, 206);"><div style="text-align: center;"><span style="color: rgb(255, 255, 255);">Prioridad</span></div></td><td style="width: 28.2534%; border: 1px solid rgb(173, 173, 173); background-color: rgb(43, 169, 206);"><div style="text-align: center;"><span style="color: rgb(255, 255, 255);">Proyecto</span></div></td><td style="width: 28.2534%; border: 1px solid rgb(173, 173, 173); background-color: rgb(43, 169, 206);"><div style="text-align: center;"><span style="color: rgb(255, 255, 255);">Actividad</span></div></td><td style="width: 13.5274%; border: 1px solid rgb(173, 173, 173); background-color: rgb(43, 169, 206);"><div style="text-align: center;"><span style="color: rgb(255, 255, 255);">Vencimiento</span></div></td><td style="width: 9.9315%; border: 1px solid rgb(173, 173, 173); background-color: rgb(43, 169, 206);"><div style="text-align: center;"><span style="color: rgb(255, 255, 255);">Estado</span></div></td><td style="width: 9.4178%; border: 1px solid rgb(173, 173, 173); background-color: rgb(43, 169, 206);"><div style="text-align: center;"><span style="color: rgb(255, 255, 255);">Acceso directo</span></div></td></tr>'.format(**flags)

                for fb in forms_b:
                    if fb['expired']=='3':
                        fb['flag']=cfg.img_red_flag
                    elif fb['expired']=='2':
                        fb['flag']=cfg.img_orange_flag
                    else:
                        fb['flag']=cfg.img_yellow_flag
                    link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(fb['project_id'])),str(fb['form_id']))
                    fb['link']='<a href="%s">Ir</a>'%link
                    template+='<tr><td style="width: 10.274%; border: 1px solid rgb(173, 173, 173);"><div style="text-align: center;"><img src={flag} style="height: 12px; width: 12px;"></div></td><td style="width: 28.2534%; border: 1px solid rgb(173, 173, 173);">{project_name}</td><td style="width: 28.2534%; border: 1px solid rgb(173, 173, 173);">{form_name}</td><td style="width: 13.5274%; border: 1px solid rgb(173, 173, 173);"><div style="text-align: center;">{resolve_before}</div></td><td style="width: 9.9315%; border: 1px solid rgb(173, 173, 173);"><div style="text-align: center;">{status}</div></td><td style="width: 9.4178%; border: 1px solid rgb(173, 173, 173);"><div style="text-align: center;">{link}</div></td></tr>'.format(**fb)

                template+='</tbody></table><br><p><img src="%s" alt="" width="250" height="70"></p><p><br></p>'%cfg.img_rb_logo
                subject='Resumen de actividades'
                body=template
                recipients=[ub['email']]
                MF.sendMail(subject,body,recipients)
                logger.info("Envía correo de usuario %s"%ub['name'])
                print "Envía correo de usuario %s"%ub['name']
            else:
                print "Usuario %s sin formularios"%ub['name']
                logger.info("Usuario %s sin formularios"%ub['name'])





    except:
        exc_info = sys.exc_info()
        logger.error(traceback.format_exc(exc_info))

if __name__ == '__main__':
    main()
