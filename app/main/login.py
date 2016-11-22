

from flask import (Flask, abort, flash, g, redirect, render_template, request,
                   session, url_for)
from flask import request, Response
from app import app
from app.main.model import User
from flask_login import (LoginManager, current_user,
                         login_user, logout_user)


from functools import wraps
from flask.ext.restless import ProcessingException


# def check_auth(username, password):
#     """This function is called to check if a username /
#     password combination is valid.
#     """
#     return username == 'admin' and password == 'secret'


# def authenticate():
#     """Sends a 401 response that enables basic auth"""
#     return Response(
#         'Could not verify your access level for that URL.\n'
#         'You have to login with proper credentials', 401,
#         {'WWW-Authenticate': 'Basic realm="Login Required"'})


# def requires_auth(f):
#     @wraps(f)
#     def decorated(*args, **kwargs):
#         auth = request.authorization
#         if not auth or not check_auth(auth.username, auth.password):
#             return authenticate()
#         return f(*args, **kwargs)
#     return decorated


def initLogin(app):
    """Sends a 401 response that enables basic auth"""
    global __secret_user__    
    global __secret_password__ 
    __secret_user__ = app.config['SECRET_USER']
    __secret_password__ = app.config['SECRET_PASSWORD']

def auth_func(*args, **kw):
    #raise ProcessingException(description='Not authenticated!', code=401)
    pass


def check_auth(username, password):
    """This function is called to check if a username /
    password combination is valid.
    """
    return username == __secret_user__ and password == __secret_password__

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






# login = LoginManager()
# @login.user_loader
# def load_user(user_id):
#     return db.Query(User).filter(User.UserId == user_id)
# @login.request_loader
# def load_request(user_id):
#     return db.Query(User).filter(User.UserId == user_id)


# def initLogin(app):
#     login.init_app(app)
#     login.session_protection = "strong"
#     login.login_view = 'login'




# @app.route('/login', methods=['GET', 'POST'])
# def doLogin():
#     if request.method == 'GET':
#         return render_template('views/login.html')

#     username = request.form['username']
#     password = request.form['password']
#     remember_me = False
#     if 'remember_me' in request.form:
#         remember_me = True
#     print('test')
#     # registered_user = db.Query(User).filter(
#     #     User.UserName == username, User.Password == password).first()

#     registered_user = User.query.filter(User.UserName == username).first()
#     print('user', registered_user)

#     if registered_user is None:
#         flash('Username or Password is invalid', 'error')
#         return redirect(url_for('doLogin'))
#     login_user(registered_user, remember=remember_me)
#     #flash('Logged in successfully')
#     return redirect(request.args.get('next') or url_for('main.main'))
