from flask import blueprints
from flask import request, Response
from flask.templating import render_template
from app.main.views import MainForm
from app.main.login import login_required

from functools import wraps


mainModule = blueprints.Blueprint('main', __name__, url_prefix='/main')



@mainModule.route('/')
@login_required
def main():
    form = MainForm()
    return render_template('views/main.html', form=form)
