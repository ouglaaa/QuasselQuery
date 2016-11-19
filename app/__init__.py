# Import flask and template operators
from flask import Flask, render_template

# Import SQLAlchemy
from flask_sqlalchemy import SQLAlchemy
from flask_restless.manager import APIManager


# Define the WSGI application object
app = Flask(__name__)

# Configurations
app.config.from_object('config')

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

# Define the database object which is imported
# by modules and controllers

#
# import sqlite3
# # t = sqlite3.connect('file:../_db/quassel-storage.sqlite?mode=ro', uri=True)
# opts = {'uri': True}
# t = sqlite3.connect('file:../_db/quassel-storage.sqlite', **opts)
# print('t', t)
# res = t.execute('SELECT * FROM NETWORK').fetchone()
#
# print('res', res)
#
#
#
# from sqlalchemy import *
# from sqlalchemy.orm import *
# from zope.sqlalchemy import ZopeTransactionExtension
#
# from sqlite3 import dbapi2 as sqlite
# engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'], module=sqlite)
#
#
#
#
# # Global session manager: DBSession() returns the Thread-local
# # session object appropriate for the current web request.
# maker = sessionmaker(autoflush=True, autocommit=False,
#                     extension=ZopeTransactionExtension())
# DBSession = scoped_session(maker)
# DBSession.configure(bind=engine)
# print(DBSession)

from sqlalchemy.engine import Engine
from sqlalchemy import event
import re
import sys


def re_fn(expr, item):
    try:
        reg = re.compile(expr, re.I)
        if item is None:
            item = ""
        return reg.match(item) is not None
    except:
        print(sys.exc_info())


db = SQLAlchemy(app)
engine = db.get_engine(app)
engine.connect()


@event.listens_for(engine, "begin")
def do_begin(conn):
    conn.connection.create_function('regexp', 2, re_fn)

api = APIManager(app, flask_sqlalchemy_db=db)


# Sample HTTP error handling
@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

from app.main.controllers import mainModule
# from app.main.services import dataModule


app.register_blueprint(mainModule)
# app.register_blueprint(dataModule)


from app.main.services import initServices, addCorsHeaders

initServices(api)


# for bp in app.blueprints.values():
#    print(bp.name, bp.url_prefix, bp.subdomain)
#    if bp.url_prefix == '/api':
#        print('go')
#        bp.after_request(addCorsHeaders)
