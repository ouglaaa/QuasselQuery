from flask import blueprints
from flask import request, Response
from flask.templating import render_template
from app.main.views import MainForm
from app.main.login import login_required, get_login
from app.main.model import CurrentUser
from functools import wraps
import json

mainModule = blueprints.Blueprint('main', __name__, url_prefix='/main')


@mainModule.route('/')
@login_required
def main():
    form = MainForm()
    auth = get_login()
    user = CurrentUser
    form.user = {
        'UserId': user.UserId,
        'UserName': user.UserName,
        'Token': auth,
    }
    return render_template('views/main.html', form=form)
