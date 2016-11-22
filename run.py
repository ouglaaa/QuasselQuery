
from app import app
import ssl

port = app.config["LISTEN_PORT"]
addr = app.config["LISTEN_ADDR"]
debug = app.config["DEBUG_MODE"]
cert = app.config["SSL_CERT_PATH"]
key = app.config["SSL_KEY_PATH"]
ssl = app.config["SSL_SUPPORT"]

if ssl:
    context = (cert, key)
else:
    context = None

app.run(host=addr, port=port, debug=debug, ssl_context=context)
