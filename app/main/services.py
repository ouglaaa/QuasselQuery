
from flask import blueprints, request, Response
from flask.templating import render_template
from app.main.views import MainForm
from app.main.model import *


def addCorsHeaders(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
#     response.headers['Access-Control-Allow-Credentials'] = 'true'


def initServices(api):
    # dataModule = blueprints.Blueprint('data', __name__, url_prefix = '/data')
    api.create_api(Buffer)
    api.create_api(Network)
    api.create_api(Identity)
    api.create_api(Backlog, results_per_page=-1)


from flask_restless.search import OPERATORS

OPERATORS["REGEXP"] = lambda f, a: f.op('regexp')(a)

# @dataModule.route('/buffers')
# # @expose('json')
# def buffers():
#     networkId = request.args.get('networkId')
#     results = Buffer.GetBuffersForNetworkId(networkId).dumps()
#     print(results)
#     return Response()
# #     return jsonify()
# #     return json.dumps(dict (results = results))
#
#
# @dataModule.route('/senders')
# @expose('json')
# def senders():
#     results = Sender.query.all()
#     return dict(results = results)
