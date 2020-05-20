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
        # #forms pendientes por resolver que aún no pasan la fecha de vencimiento
        # #se envía a usuario asignado
        # forms_non_expired=db.query("""
        #     select  b.form_id, b.name, b.project_id, (select a.email from system.user a where a.user_id=b.assigned_to) as assigned_mail, to_char(b.resolve_before,'DD/MM/YYYY') as resolve_before, to_char(b.resolved_date,'DD/MM/YYYY') as resolved_date from project.form b
        #     where b.status_id in (3,4) and b.resolve_before >=now()
        # """).dictresult()
        #
        # template='<p style="text-align: center;"><img src="{top_img}" alt="" width="70" height="70" /></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Estimado usuario:</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">No olvides que tienes pendiente por resolver el formulario <em>{name}</em>, deber&aacute; ser terminado a m&aacute;s tardar el {resolve_before}.</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Puedes acceder al formulario a trav&eacute;s del siguiente {link}.</span></p><p><img src="{bottom_img}" alt="" width="250" height="70" /></p>'
        #
        # if forms_non_expired!=[]:
        #     for fne in forms_non_expired:
        #         fne['top_img']=cfg.img_form_reminder
        #         fne['bottom_img']=cfg.img_rb_logo
        #         link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(fne['project_id'])),str(fne['form_id']))
        #         fne['link']='<a href="%s"> link</a>'%link
        #         subject='Recordatorio: Cuestionario pendiente'
        #         body=template.format(**fne)
        #         recipients=[fne['assigned_mail']]
        #         MF.sendMail(subject,body,recipients)
        #
        # logger.info("Termina formularios pendientes que no ha pasado su fecha de vencimiento a elaborador")
        # print "Termina formularios pendientes que no ha pasado su fecha de vencimiento a elaborador"
        #
        # #forms que faltan 3 días para que expire
        # #se envía a primer revisor
        # forms_about_expire=db.query("""
        #     select  b.form_id, b.name, b.project_id, (select a.name from system.user a where a.user_id=b.assigned_to) as assignee_name, to_char(b.resolve_before,'DD/MM/YYYY') as resolve_before, to_char(b.resolved_date,'DD/MM/YYYY') as resolved_date from project.form b
        #     where b.status_id in (3,4) and resolve_before between now()  and  now() + interval '3 days' ;
        # """).dictresult()
        # template='<p style="text-align: center;"><img src="{top_img}" alt="" width="70" height="70"></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Estimado usuario:</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Te recordamos que {assignee_name} tiene pendiente por resolver el formulario <em>{name}</em>, deber&aacute; ser terminado a m&aacute;s tardar el {resolve_before}.</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Puedes acceder al formulario a trav&eacute;s del siguiente {link}.</span></p><p><img src="{bottom_img}" alt="" width="250" height="70"></p><p><br></p>'
        # if forms_about_expire!=[]:
        #     for fae in forms_about_expire:
        #         send_to=db.query("""
        #             select a.email from system.user a, project.form_revisions b where b.form_id=%s and b.revision_number=1 and a.user_id=b.user_id
        #         """%fae['form_id']).dictresult()[0]['email']
        #         fae['top_img']=cfg.img_form_reminder
        #         fae['bottom_img']=cfg.img_rb_logo
        #         link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(fae['project_id'])),str(fae['form_id']))
        #         fae['link']='<a href="%s"> link</a>'%link
        #         subject='Recordatorio: Cuestionario pendiente'
        #         body=template.format(**fae)
        #         recipients=[send_to]
        #         MF.sendMail(subject,body,recipients)
        # logger.info("Termina formularios pendientes que no ha pasado su fecha de vencimiento a revisor")
        # print "Termina formularios pendientes que no ha pasado su fecha de vencimiento a revisor"
        #
        # #forms que ya pasaron su fecha de vencimiento
        # #se envía a usuario asignado y revisor
        # forms_expired=db.query("""
        #     select  b.form_id, b.name, b.project_id, (select a.email from system.user a where a.user_id=b.assigned_to) as assigned_mail, (select a.name from system.user a where a.user_id=b.assigned_to) as assignee_name, to_char(b.resolve_before,'DD/MM/YYYY') as resolve_before, to_char(b.resolved_date,'DD/MM/YYYY') as resolved_date from project.form b
        #     where b.status_id in (3,4) and b.resolve_before < now()
        # """).dictresult()
        #
        # template='<p style="text-align: center;"><img src="{top_img}" alt="" width="70" height="70"></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Estimado usuario:</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">No olvides que tienes pendiente por resolver el formulario <em>{name}</em>, debi&oacute; ser terminado antes del <strong>{resolve_before}.</strong></span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Puedes acceder al formulario a trav&eacute;s del siguiente {link}.</span></p><p><img src="{bottom_img}" alt="" width="250" height="70"></p>'
        #
        # template_reviewer='<p style="text-align: center;"><img src="{top_img}" alt="" width="70" height="70"></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Estimado usuario:</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Te recordamos que {assignee_name} tiene pendiente por resolver el formulario <em>{name}</em>, debi&oacute; ser terminado antes del <strong>{resolve_before}.</strong></span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Puedes acceder al formulario a trav&eacute;s del siguiente {link}.</span></p><p><img src="{bottom_img}" alt="" width="250" height="70"></p><p><br></p>'
        #
        # if forms_expired!=[]:
        #     for fe in forms_expired:
        #         fe['top_img']=cfg.img_form_expired
        #         fe['bottom_img']=cfg.img_rb_logo
        #         link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(fe['project_id'])),str(fe['form_id']))
        #         fe['link']='<a href="%s"> link</a>'%link
        #         subject='Recordatorio: Cuestionario pendiente (vencido)'
        #         body=template.format(**fe)
        #         recipients=[fe['assigned_mail']]
        #         MF.sendMail(subject,body,recipients)
        #
        #         reviewer=db.query("""
        #             select a.email from system.user a, project.form_revisions b where b.form_id=%s and b.revision_number=1 and a.user_id=b.user_id
        #         """%fe['form_id']).dictresult()[0]['email']
        #         body=template_reviewer.format(**fe)
        #         recipients=[reviewer]
        #         MF.sendMail(subject,body,recipients)
        #
        # logger.info("Termina formularios pendientes que ya pasaron su fecha de vencimiento elaborador y revisor")
        # print "Termina formularios pendientes que ya pasaron su fecha de vencimiento elaborador y revisor"


        #################################################################################################

        #inicio de template general
        template_ini='<p style="text-align: center;"><img src="{top_img}" alt="" width="70" height="70"></p><p><span style="font-size: 16px; font-family: Verdana, Geneva, sans-serif;">Estimado usuario:</span></p>'

        #obtiene todos los usuarios
        users=db.query("""
            select user_id, name, email from system.user where enabled=True order by user_id asc
        """).dictresult()
        if users!=[]:
            for u in users:
                template=''
                #expired: 
                #--1: No vencido
                #--2: Vence hoy
                #--3: Vencido
                assignee_forms=db.query("""
                    select  b.form_id,
                    b.name as form_name,
                    b.project_id,
                    a.name as project_name,
                    to_char(b.resolve_before,'DD/MM/YYYY') as resolve_before,
                    case when b.resolve_before>current_date then '1' when b.resolve_before<current_date then '3' when b.resolve_before=current_date then '2'  end as expired
                    from project.form b, project.project a
                    where b.status_id in (3,4)
                    and a.project_id=b.project_id and b.assigned_to=%s
                    order by expired desc, b.resolve_before asc
                """%u['user_id']).dictresult()

                revision_forms=db.query("""
                    select distinct(b.form_id),
                    b.name as form_name,
                    b.project_id, a.name as project_name,
                    to_char(b.resolve_before,'DD/MM/YYYY') as resolve_before_,
                    b.resolve_before,
                    to_char(b.resolved_date, 'DD/MM/YYYY') as resolved_date,
                    case when b.resolve_before>current_date then '1' when b.resolve_before<current_date then '3' when b.resolve_before=current_date then '2'  end as expired,
                    (select d.name from system.user d where d.user_id=b.assigned_to) as assignee_name
                    from project.form b, project.project a, project.form_revisions c
                    where b.status_id in (3,4)
                    and a.project_id=b.project_id and c.form_id=b.form_id and c.revision_number=1 and c.user_id=%s
                    and b.resolve_before <= current_date + interval '3 days' order by expired desc, b.resolve_before asc
                """%u['user_id']).dictresult()

                if assignee_forms!=[] or revision_forms!=[]:

                    if assignee_forms!=[]:
                        template+='<p><span style="font-family: Verdana, Geneva, sans-serif;"><span style="font-size: 16px;">Le recordamos que tiene pendientes por resolver los siguientes programas de trabajo:</span></span></p>'
                        for af in assignee_forms:
                            link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(af['project_id'])),str(af['form_id']))
                            af['link']='<a href="%s"> Acceder</a>'%link
                            template+='<p style="margin-left: 20px; margin-top:0px; padding-top:0px;"><span style="font-family: Verdana, Geneva, sans-serif;"><br><img src="{flag}" style="height:12px; width:12px;">  {form_name} con fecha de vencimiento {resolve_before}. {link} </span></p>'
                            if af['expired']=='3':
                                af['flag']=cfg.img_red_flag
                                # template+='<p style="margin-left: 20px; margin-top:0px; padding-top:0px;"><span style="font-family: Verdana, Geneva, sans-serif;"><br><i class="fa" style="color:red; font-size:16;">&#xf024;</i> {form_name} con fecha de vencimiento {resolve_before}. {link} </span></p>'

                            elif af['expired']=='2':
                                # template+='<p style="margin-left: 20px; margin-top:0px; padding-top:0px;"><span style="font-family: Verdana, Geneva, sans-serif;"><br><i class="fa" style="color:orange; font-size:16;">&#xf024;</i> {form_name} con fecha de vencimiento {resolve_before}. {link} </span></p>'
                                af['flag']=cfg.img_orange_flag
                            elif af['expired']=='1':
                                # template+='<p style="margin-left: 20px; margin-top:0px; padding-top:0px;"><span style="font-family: Verdana, Geneva, sans-serif;"><br><i class="fa" style="color:yellow; font-size:16;">&#xf024;</i> {form_name} con fecha de vencimiento {resolve_before}. {link} </span></p>'
                                af['flag']=cfg.img_yellow_flag
                            template=template.format(**af)

                    if revision_forms!=[]:
                        template+='<p style="margin-top: 0px; padding-top: 0px;"><span style="font-family: Verdana, Geneva, sans-serif;">Le informamos que los siguientes formularios, donde usted est&aacute; asignado como revisor, no han sido resueltos:</span></p>'
                        for rf in revision_forms:
                            link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(rf['project_id'])),str(rf['form_id']))
                            rf['link']='<a href="%s"> Acceder</a>'%link
                            template+='<p style="margin-left: 20px; margin-top:0px; padding-top:0px;"><span style="font-family: Verdana, Geneva, sans-serif;"><br><img src="{flag}" style="height:12px; width:12px;"> {form_name}, asignado a {assignee_name}, con fecha de vencimiento {resolve_before_}. {link}</span></p>'
                            if rf['expired']=='3':
                                rf['flag']=cfg.img_red_flag
                                # template+='<p style="margin-left: 20px; margin-top:0px; padding-top:0px;"><span style="font-family: Verdana, Geneva, sans-serif;"><br><i class="fa" style="color:red; font-size:16;">&#xf024;</i> {form_name}, asignado a {assignee_name}, con fecha de vencimiento {resolve_before_}. {link}</span></p>'
                            elif rf['expired']=='2':
                                # template+='<p style="margin-left: 20px; margin-top:0px; padding-top:0px;"><span style="font-family: Verdana, Geneva, sans-serif;"><br><i class="fa" style="color:orange; font-size:16;">&#xf024;</i> {form_name}, asignado a {assignee_name}, con fecha de vencimiento {resolve_before_}. {link}</span></p>'
                                rf['flag']=cfg.img_orange_flag
                            elif rf['expired']=='1':
                                # template+='<p style="margin-left: 20px; margin-top:0px; padding-top:0px;"><span style="font-family: Verdana, Geneva, sans-serif;"><br><i class="fa" style="color:yellow; font-size:16;">&#xf024;</i> {form_name}, asignado a {assignee_name}, con fecha de vencimiento {resolve_before_}. {link}</span></p>'
                                rf['flag']=cfg.img_yellow_flag
                            template=template.format(**rf)
                    template=template_ini+template+'<p><img src="{bottom_img}" alt="" width="250" height="70"></p><p><br></p>'
                    temp_img={
                        'bottom_img':cfg.img_rb_logo,
                        'top_img':cfg.img_form_expired
                    }
                    subject='Recordatorio: Programas de trabajo pendientes'
                    body=template.format(**temp_img)
                    recipients=[u['email']]
                    MF.sendMail(subject,body,recipients)

                else:
                    print "Usuario %s sin formularios"%u['name']
                    logger.info("Usuario %s sin formularios"%u['name'])








    except:
        exc_info = sys.exc_info()
        logger.error(traceback.format_exc(exc_info))

if __name__ == '__main__':
    main()
