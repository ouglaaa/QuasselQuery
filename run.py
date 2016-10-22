
from app import app
import ssl
#from pip._vendor.requests.packages.urllib3.util.ssl_ import SSLContext

#context = SSLContext(ssl.PROTOCOL_SSLv23)
#context.load_cert_chain("cert.crt", "priv.key", 'testest')


app.run(host='0.0.0.0', port=8000, debug=True)#, ssl_context=context)
