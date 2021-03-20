#-*- coding: utf-8 -*-

import os
# from pg import DB
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask
from flask_mail import Mail, Message
from flask import render_template

def page_not_found(e):
    return render_template('error.html'),404

def create_app(test_config=None):

    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.debug=True
    formatter = logging.Formatter(
        "[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
    handler = RotatingFileHandler('/var/log/rbaudit_v2/aud.log', maxBytes=10000000, backupCount=5)
    handler.setFormatter(formatter)
    handler.setLevel(logging.INFO)
    app.logger.addHandler(handler)

    app.register_error_handler(404, page_not_found)
    # mail = Mail(app)
    # from views import app_config as cfg
    from views import app_config as cfg
    app.config.from_mapping(
        # SECRET_KEY=cfg.app_secret_key,
        SECRET_KEY=cfg.app_secret_key,
        #DATABASE=os.path.join(app.instance_path, 'taskapp.sqlite'),
        DEBUG_TB_INTERCEPT_REDIRECTS=False,
        ###***** Deseleccionar la sección con # para subir cambios a prod******
        # SESSION_COOKIE_SECURE=False,
        # SESSION_COOKIE_HTTPONLY=False,
        # SESSION_COOKIE_SAMESITE='',
        # SERVER_NAME='easytask.com.mx',
        # SESSION_COOKIE_PATH=None
    )
    # mail = Mail(app)
    # toolbar=DebugToolbarExtension(app)
    # logging.basicConfig(filename='/var/log/rbaudit/audlog.log', format='%(asctime)s %(message)s',level=logging.INFO)



    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass


    from views import home
    app.register_blueprint(home.bp)
    from views import project
    app.register_blueprint(project.bp)
    from views import notifications
    app.register_blueprint(notifications.bp)
    from views import users
    app.register_blueprint(users.bp)
    from views import login
    app.register_blueprint(login.bp)
    from views import myprojects
    app.register_blueprint(myprojects.bp)
    from views import activities
    app.register_blueprint(activities.bp)
    from views import template
    app.register_blueprint(template.bp)
    app.add_url_rule('/',endpoint='home.home')
    app.add_url_rule('/home', endpoint='home.home')

    return app

app=create_app()
