

from flask import (Flask, abort, flash, g, redirect, render_template, request,
                   session, url_for)
from flask import request, Response
from app import app
from app.main.model import User, CurrentUser

from functools import wraps


import hashlib
import uuid
from datetime import datetime, timedelta


tokens = dict()


def get_token(token):
    if not token:
        return False, None
    if token in tokens.keys():
        tok = tokens[token]
        if tok.ExpireDate < datetime.now():
            return False, None
        else:
            return True, tok
    else:
        return False, None


def add_token(userid, username):
    if not any(lambda t: t.UserName == username for t in tokens):
        token = object()
        token = Token(userid, username, uuid.uuid4().__str__(), datetime.now() + timedelta(days=30))
    else:
        token = next(t for t in tokens.values() if t.UserName == username)
        token.ExpireDate = datetime.now() + timedelta(days=30)
    CurrentUser(token=token)
    tokens[token.Token] = token
    return token


def check_token(token):
    (valid, tok) = get_token(token)
    if not valid:
        return False
    CurrentUser(token=tok)
    return valid


def get_hashed_password_and_salt(user):
    if ":" not in user.Password:
        return user.Password, ""
    tab = user.Password.split(":")
    return tab[0], tab[1]


def hash_password(password, salt, hash_version):
    if hash_version == 1:
        hash_object = hashlib.sha512(password.encode() + salt.encode())
        hex_dig = hash_object.hexdigest()
    else:
        hash_object = hashlib.sha1(password.encode() + salt.encode())
        hex_dig = hash_object.hexdigest()
    return hex_dig


def check_auth(username, password):
    """This function is called to check if a username /
    password combination is valid.
    """
    user = User.query.filter(User.UserName == username).first()
    if not user:
        return False
    hash_pwd, salt = get_hashed_password_and_salt(user)
    hashed = hash_password(password, salt, 1)
    if hashed == hash_pwd:
        add_token(user.UserId, user.UserName)
        return True
    hashed = hash_password(password, salt, 0)
    if hashed == hash_pwd:
        add_token(user.UserId, user.UserName)
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
        if not check_token(get_token_header()):
            auth = request.authorization
            if not auth or not check_auth(auth.username, auth.password):
                return authenticate()
        return f(*args, **kwargs)
    return decorated

def get_token_header():
    H, V = next(((h, v) for (h, v) in request.headers if h.lower() == "http-token"), (None, None))
    return V
def auth_func(*args, **kw):
    if not check_token(get_token_header()):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            abort(401)
        
class Token:
    def __init__(self, userid, username, token, expireDate):
        self.UserId = userid
        self.UserName = username
        self.Token = token
        self.ExpireDate = expireDate