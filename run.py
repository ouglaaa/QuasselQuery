
from app import app
import ssl
import os

port = app.config["LISTEN_PORT"]
addr = app.config["LISTEN_ADDR"]
debug = app.config["DEBUG_MODE"]
cert = app.config["SSL_CERT_PATH"]
key = app.config["SSL_KEY_PATH"]
ssl_support = app.config["SSL_SUPPORT"]
current_dir =  os.path.dirname(os.path.realpath(__file__))

if (os.path.isabs(cert) == False):
    cert = os.path.join(current_dir, cert)
if (os.path.isabs(key) == False):
    key = os.path.join(current_dir, key)

if ssl_support:
    context = (cert, key, ssl.PROTOCOL_TLSv1_2)
else:
    context = None



app.run(host=addr, port=port, debug=debug, ssl_context=context)
