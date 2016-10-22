from flask import blueprints
from flask.templating import render_template
from app.main.views import MainForm


mainModule = blueprints.Blueprint('main', __name__, url_prefix = '/main')

@mainModule.route('/')
def main():
    form= MainForm()
    return render_template('views/main.html', form=form)

