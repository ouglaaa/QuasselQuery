from flask import blueprints
from flask import request, Response, make_response
from flask.templating import render_template
from app.main.views import MainForm
from app.main.login import login_required

from functools import wraps


mainModule = blueprints.Blueprint('main', __name__, url_prefix='/main')



@mainModule.route('/')
@login_required
def main():
    auth = request.headers.get("authorization")
    form = MainForm()
    r = make_response( render_template('views/main.html', form=form))
    r.headers.set("authorization", auth)
    return r
