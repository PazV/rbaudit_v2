#-*- coding: utf-8 -*-

import logging
import sys
import traceback
import json
from flask import Flask, session, request, logging, g
from flask_mail import Mail, Message
import random
import app_config as cfg
import smtplib
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText
import re
import os
from .db_connection import getDB
db = getDB()
app=Flask(__name__)

class GeneralFunctions:
    def getDict(self,form,method):
        """
        Parameters:request.form
        Description:Obtains ImmutableMultiDict object and returns [flag success (True/False) ,data dictionary]
        """
        try:
            if method=='post':
                d=form.to_dict(flat=False)
                e=d.keys()[0]
                f=json.loads(e)
                return True,f
            else:
                d=form.to_dict(flat=False)
                return True,d
        except:
            exc_info = sys.exc_info()
            app.logger.info(traceback.format_exc(exc_info))
            return False,''

    def generateRandomPassword(self,pass_len):
        """
        Parameters:pass_len(indicates the password length)
        Description:Generates a random password with the length stablished in pass_len
        """
        try:
            sample='abcdefghijklmnopqstuvwxyzABCDEFGHIJKLMNOPQRSTUVWZYX0123456789_-.$#'
            password=''.join(str(i) for i in random.sample(sample,pass_len))
            return True,password
        except:
            exc_info = sys.exc_info()
            app.logger.info(traceback.format_exc(exc_info))
            return False, ''

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
            app.logger.info(resp)
            app.logger.info("sends mail")
            response['success']=True
        except:
            exc_info=sys.exc_info()
            app.logger.info(traceback.format_exc(exc_info))
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

    def userInfo(self,extras=None):
        user_info=db.query("""
            select user_id,profile_picture_class,workspace_id
            from system.user where user_id=%s
        """%session['user_id']).dictresult()[0]
        if extras!=None:
            for x in extras:
                user_info.update(x)
        g.user_info=json.dumps(user_info)
        g.profile_picture_class=user_info['profile_picture_class']
        return g

    def getNotifLink(self,link_content,project_id,form_id):
        try:
            project_factor=int(project_id)*int(cfg.project_factor)
            link_content2=link_content.replace('<project_factor>',str(project_factor))
            if form_id!=-1:
                link_content3=link_content2.replace('<form_id>',str(form_id))
                link=os.path.join(cfg.host,link_content3)
            else:
                link=os.path.join(cfg.host,link_content2)
            return link
        except:
            app.logger.info(traceback.format_exc(sys.exc_info()))
            return "#"

    def as_text(self,value):
        if value is None:
            return ""
        else:
            try:
                return str(value)
            except:
                return value

    # def createNotification(self,type,project_id,form_id,msg=None):
    def createNotification(self,type,data):
        try:
            form_info=db.query("""
                select
                    name,
                    assigned_to,
                    (select a.name from system.user a where a.user_id=assigned_to) as assigned_to_name,
                    to_char(resolve_before,'DD-MM-YYYY') as resolve_before,
                    user_last_update,
                    (select a.name from system.user a where a.user_id=user_last_update) as user_last_update_name,
                    revisions
                from
                    project.form
                where project_id=%s
                and form_id=%s
            """%(data['project_id'],data['form_id'])).dictresult()
            if form_info!=[]:
                form_info=form_info[0]
            notification={
                'project_id':data['project_id'],
                'form_id':data['form_id'],
                'sent_date':'now',
                'read':False
            }
            if type=='publish_form':
                notification['subject']='Te han asignado un formulario'
                notification['msg']='%s te ha asignado el formulario <b>%s</b>, que deberá ser resuelto a más tardar el día %s.'%(form_info['user_last_update_name'],form_info['name'],form_info['resolve_before'])
                notification['user_from']=form_info['user_last_update']
                notification['user_to']=form_info['assigned_to']
                notification['link_content']='/project/<project_factor>/<form_id>'
                notification['link_text']='Ir a formulario'

            elif type=='send_to_revision1':
                revs=form_info['revisions'].split(",")
                notification['subject']='Formulario enviado a revisión'
                notification['msg']='%s ha finalizado el formulario <b>%s</b> y te lo ha enviado a revisión.'%(form_info['user_last_update_name'],form_info['name'])
                notification['user_from']=form_info['user_last_update']
                notification['user_to']=int(revs[0].split(":")[1])
                notification['link_content']='/project/<project_factor>/<form_id>'
                notification['link_text']='Ir a formulario'

            elif type=='return_form':
                mensaje=''
                if data['msg'].strip()!='':
                    mensaje='<br>%s dice: <br><br><span class="notif-msg-quote"><i class="fa fa-quote-left" style="font-style:italic;"></i>%s<i class="fa fa-quote-right" style="font-style:italic" ></i></span>'%(form_info['user_last_update_name'],data['msg'].encode('utf-8'))
                notification['subject']='Formulario regresado'
                notification['msg']='%s ha terminado de revisar el formulario <b>%s</b> y te lo ha asignado nuevamente.<br>%s<br>'%(form_info['user_last_update_name'],form_info['name'],mensaje)
                notification['user_from']=form_info['user_last_update']
                notification['user_to']=form_info['assigned_to']
                notification['link_content']='/project/<project_factor>/<form_id>'
                notification['link_text']='Ir a formulario'

            elif type=='finish_revision1_torev2':
                #se revisa si hay un segundo revisor, en caso de no haber, se envía la notificación al gerente del proyecto
                revs=form_info['revisions'].split(",")
                if len(revs)>1:
                    notification['user_to']=int(revs[1].split(":")[1])
                else:
                    manager=db.query("""
                        select a.user_id from system.user a,
                        project.project b
                        where b.project_id=%s
                        and a.user_id=b.manager
                    """%project_id).dictresult()[0]
                    notification['user_to']=manager['user_id']
                mensaje=''
                if data['msg'].strip()!='':
                    mensaje='<br>%s dice: <br><br><span class="notif-msg-quote"><i class="fa fa-quote-left" style="font-style:italic;"></i>%s<i class="fa fa-quote-right" style="font-style:italic" ></i></span>'%(form_info['user_last_update_name'],data['msg'].encode('utf-8'))
                notification['subject']='Formulario revisado'
                notification['msg']='%s ha terminado de revisar el formulario <b>%s</b>.%s<br> Puedes agregar comentarios finales al formulario.'%(form_info['user_last_update_name'],form_info['name'],mensaje)
                notification['user_from']=form_info['user_last_update']
                notification['link_content']='/project/<project_factor>/<form_id>'
                notification['link_text']='Ir a formulario'

            elif type=='finish_revision1_toassignee':
                mensaje=''
                if data['msg'].strip()!='':
                    mensaje='<br>%s dice: <br><br><span class="notif-msg-quote"><i class="fa fa-quote-left" style="font-style:italic;"></i>%s<i class="fa fa-quote-right" style="font-style:italic" ></i></span>'%(form_info['user_last_update_name'],data['msg'].encode('utf-8'))
                notification['subject']='Formulario revisado'
                notification['msg']='%s ha terminado de revisar el formulario <b>%s</b>.%s<br>'%(form_info['user_last_update_name'],form_info['name'],mensaje)
                notification['user_from']=form_info['user_last_update']
                notification['user_to']=form_info['assigned_to']
                notification['link_content']='/project/<project_factor>/<form_id>'
                notification['link_text']='Ir a formulario'

            elif type=='add_user_to_project':
                notification['subject']='Has sido agregado al proyecto'
                project_info=db.query("""
                    select manager, name from project.project where project_id=%s
                """%data['project_id']).dictresult()[0]
                notification['msg']='Bienvenido al proyecto <b>%s</b>.'%project_info['name']
                #envía la notificación el gerente del proyecto
                notification['user_from']=project_info['manager']
                notification['user_to']=data['user_id']
                notification['link_content']='/project/<project_factor>'
                notification['link_text']='Ir a proyecto'
            elif type=='close_form':
                notification['subject']='Formulario cerrado'
                mensaje='<br>%s dice: <br><br><span class="notif-msg-quote"><i class="fa fa-quote-left" style="font-style:italic;"></i>%s<i class="fa fa-quote-right" style="font-style:italic" ></i></span>'%(form_info['user_last_update_name'],data['msg'].encode('utf-8'))
                notification['msg']='El formulario %s ha sido cerrado.%s'%(form_info['name'],mensaje)
                notification['user_from']=form_info['user_last_update']
                notification['user_to']=data['user_to']
                notification['link_content']='/project/<project_factor>/<form_id>'
                notification['link_text']='Ir a formulario'

            elif type=='send_next_revision':
                notification['subject']='Enviado a revisión'
                mensaje='<br>%s dice: <br><br><span class="notif-msg-quote"><i class="fa fa-quote-left" style="font-style:italic;"></i>%s<i class="fa fa-quote-right" style="font-style:italic" ></i></span>'%(form_info['user_last_update_name'],data['msg'].encode('utf-8'))
                notification['msg']='El formulario %s ha sido revisado, y te ha sido asignado para su siguiente revisión. %s'%(form_info['name'],mensaje)
                notification['user_from']=form_info['user_last_update']
                notification['user_to']=data['user_to']
                notification['link_content']='/project/<project_factor>/<form_id>'
                notification['link_text']='Ir a formulario'


            db.insert('project.notification',notification)
            return True

        except:
            app.logger.info(traceback.format_exc(sys.exc_info()))
            return False


    def checkPermission(self,data):
        try:
            allowed=db.query("""
                select %s from system.user where user_id=%s
            """%(data['permission'],data['user_id'])).dictresult()
            if allowed[0][data['permission']]==True:
                return True,True
            else:
                return True,False
        except:
            app.logger.info(traceback.format_exc(sys.exc_info()))
            return False,False
                                                                                                                                                                                                                                                                                       
    def sendMailNotification(self,data):
        try:
            form_info=db.query("""
                select  b.name, b.project_id, (select a.name from system.user a where a.user_id=b.assigned_to) assigned_to, to_char(b.resolve_before,'DD/MM/YYYY') as resolve_before, to_char(b.resolved_date,'DD/MM/YYYY') as resolved_date from  project.form b where b.form_id=%s
            """%data['form_id']).dictresult()[0]
            form_info['bottom_img']=cfg.img_rb_logo
            link=os.path.join(cfg.host,'project',str(cfg.project_factor*int(form_info['project_id'])),str(data['form_id']))
            form_info['link']='<a href="%s"> link</a>'%link
            assignee_mail=db.query("""
                select a.email from system.user a, project.form b where a.user_id=b.assigned_to and b.form_id=%s
            """%data['form_id']).dictresult()
            recipients=[]
            if data['type']=='new_form':
                form_info['top_img']=cfg.img_new_form
                template='<p style="text-align: center;"><img src="{top_img}" alt="" width="50" height="50" /></p><p style="text-align: center;">&nbsp;</p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Estimado usuario:</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Le notificamos que le ha sido asignado el formulario "{name}", el cual se espera sea resuelto a m&aacute;s tardar&nbsp;<em>{resolve_before}.</em></span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Para acceder al formulario, dar click en el siguiente {link}.</span></p><p><img src="{bottom_img}" alt="" width="250" height="70" /></p>'
                subject='Nuevo cuestionario'
                recipients.append(assignee_mail[0]['email'])

            elif data['type']=='resolved_form':
                revisions=db.query("""
                    select (select a.name from system.user a where a.user_id=b.user_id) as revisor, to_char(b.revision_date,'DD/MM/YYYY') as revision_date, b.revision_number from project.form_revisions b where b.form_id=%s order by b.revision_number asc
                """%data['form_id']).dictresult()
                revision_str='<ul>'
                for r in revisions:
                    revision_str+='<li><span style="font-family: Verdana,Geneva,sans-serif;"><span style="color: rgb(77, 77, 77);">Revisi&oacute;n %s: %s - %s</span></span></li>'%(r['revision_number'],r['revisor'],r['revision_date'])
                revision_str+='</ul>'
                form_info['revisions']=revision_str
                form_info['top_img']=cfg.img_resolved_form
                # template='<p style="text-align: center;"><img src="{top_img}" alt="" width="50" height="50" /></p><p style="text-align: center;">&nbsp;</p><p>Estimado usuario:</p><p>Le informamos que el formulario {name} ha sido completado y revisado.</p><p>Resuelto por {assigned_to} - {resolved_date}</p><p>{revisions}</p><p>Puede acceder al formulario a trav&eacute;s del siguiente {link}.</p><p><img src="{bottom_img}" alt="" width="250" height="70" /></p>'

                template='<p style="text-align: center;"><img src="{top_img}" alt="" width="50" height="50" /></p><p style="text-align: center;">&nbsp;</p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Estimado usuario:</span></p><p><span style="font-family: Verdana,Geneva,sans-serif;"><span style="color: rgb(77, 77, 77);">Le informamos que el formulario <em>{name}</em> ha sido completado y revisado.</span></span></p><p><span style="font-family: Verdana,Geneva,sans-serif;"><span style="color: rgb(77, 77, 77);">Resuelto por {assigned_to} - {resolved_date}</span></span></p><p>{revisions}</p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Puede acceder al formulario a través del siguiente {link}.</span></p><p><img src="{bottom_img}" alt="" width="250" height="70" /></p>'

                revisor_mails=db.query("""
                    select a.email from system.user a, project.form_revisions b
                    where a.user_id=b.user_id and b.form_id=%s
                """%data['form_id']).dictresult()
                for r in revisor_mails:
                    recipients.append(r['email'])
                recipients.append(assignee_mail[0]['email'])
                subject='Cuestionario finalizado'


            elif data['type']=='reminder_resolve_form':
                form_info['top_img']=cfg.img_form_reminder
                template='<p style="text-align: center;"><img src="{top_img}" alt="" width="50" height="50" /></p><p style="text-align: center;">&nbsp;</p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Estimado usuario:</span></p><p>&nbsp;</p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">No olvides que tienes pendiente por resolver el formulario <em>{name}</em>, deber&aacute; ser terminado a m&aacute;s tardar el {resolve_before}.</span></p><p><span style="font-family: Verdana, Geneva, sans-serif; color: rgb(77, 77, 77);">Puede acceder al formulario a trav&eacute;s del siguiente {link}.</span></p><p><img src="{bottom_img}" alt="" width="250" height="70" /></p>'

                recipients.append(assignee_mail[0]['email'])
                subject='Recordatorio cuestionario por resolver'
            app.logger.info(recipients)
            body=template.format(**form_info)
            response=self.sendMail(subject,body,recipients)
            app.logger.info(response)

            return True
        except:
            app.logger.info(traceback.format_exc(sys.exc_info()))
            return False
