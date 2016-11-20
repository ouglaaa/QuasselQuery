from flask import blueprints
from flask import request, Response
from flask.templating import render_template
from app.main.views import MainForm
from flask_login import login_required

from functools import wraps


mainModule = blueprints.Blueprint('main', __name__, url_prefix='/main')


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


@mainModule.route('/')
# @login_required
def main():
    form = MainForm()
    return render_template('views/main.html', form=form)
