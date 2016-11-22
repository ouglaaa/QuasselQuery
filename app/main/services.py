
from flask import Response, blueprints, request
from flask.templating import render_template
from flask_restless.search import OPERATORS

from app.main.model import Backlog, Buffer, Identity, Network
from app.main.views import MainForm


def addCorsHeaders(response):
    response.headers['Access-Control-Allow-Origin'] = '*'



def initServices(api):    
    api.create_api(Buffer)
    api.create_api(Network)
    api.create_api(Identity)
    api.create_api(Backlog, results_per_page=-1)





OPERATORS["REGEXP"] = lambda f, a: f.op('regexp')(a)
