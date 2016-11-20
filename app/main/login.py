

from flask import (Flask, abort, flash, g, redirect, render_template, request,
                   session, url_for)

from app import app, db
from app.main.model import User
from flask_login import (LoginManager, current_user, login_required,
                         login_user, logout_user)

login = LoginManager()


@login.user_loader
def load_user(user_id):
    return db.Query(User).filter(User.UserId == user_id)


def initLogin(app):
    login.init_app(app)
    login.session_protection = "strong"
    login.login_view = 'login'


@app.route('/login', methods=['GET', 'POST'])
def doLogin():
    if request.method == 'GET':
        return render_template('views/login.html')

    username = request.form['username']
    password = request.form['password']
    remember_me = False
    if 'remember_me' in request.form:
        remember_me = True
    registered_user = User.query.filter_by(
        username=username, password=password).first()
    if registered_user is None:
        flash('Username or Password is invalid', 'error')
        return redirect(url_for('login'))
    login_user(registered_user, remember=remember_me)
    flash('Logged in successfully')
    return redirect(request.args.get('next') or url_for('index'))
