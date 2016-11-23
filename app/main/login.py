

from flask import (Flask, abort, flash, g, redirect, render_template, request,
                   session, url_for)
from flask import request, Response
from app import app
from app.main.model import User
from flask_login import (LoginManager, current_user,
                         login_user, logout_user)


from functools import wraps
from flask.ext.restless import ProcessingException


import hashlib


    
def get_hashed_password_and_salt(user):
    tab = user.Password.split(":")
    return tab[0], tab[1]

def hash_password(password, salt, hash_version):
    if hash_version == 1:
        hash_object = hashlib.sha512(password.encode() + salt.encode())
        hex_dig = hash_object.hexdigest()
    else:
        pass
    return hex_dig


def check_auth(username, password):
    """This function is called to check if a username /
    password combination is valid.
    """
    user = User.query.filter(User.UserName == username).first()
    if not user:
        return False
    hash_pwd, salt = get_hashed_password_and_salt(user)
    hashed = hash_password(password, salt, user.HashVersion)
    if hashed == hash_pwd:
        global __Current_User__ 
        __Current_User__ = user
        return True
    return False


def authenticate():
    """Sends a 401 response that enables basic auth"""
    return Response(
        'Could not verify your access level for that URL.\n'
        'You have to login with proper credentials', 401,
        {'WWW-Authenticate': 'Basic realm="Login Required"'})



def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated


def auth_func(*args, **kw):
    #raise ProcessingException(description='Not authenticated!', code=401)
    auth = request.authorization
    if not auth or not check_auth(auth.username, auth.password):
        abort(401)
    

def get_login():
    auth = request.headers["Authorization"].split(" ")[1]
    return auth



