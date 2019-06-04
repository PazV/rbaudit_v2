#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g
from wtforms import Form, StringField, TextAreaField, PasswordField, validators
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
# from .db_connection import getDB
import logging
# db = getDB()
# from .auth import is_logged_in
import json
# from flask import current_app as app


bp = Blueprint('project', __name__, url_prefix='/project' )

@bp.route('/')
def project():
    return render_template('project.html')

@bp.route("/createform/<int:step>", methods=['GET','POST'])
def createform(step):
    if int(step)==1:
        return render_template('createform_step1.html')
    elif int(step)==2:
        return render_template('createform_step2.html')

    # else:
    #     return render_template('error.html')
