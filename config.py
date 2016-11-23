# Statement for enabling the development environment
DEBUG = True

# Define the application directory
import os
BASE_DIR = os.path.abspath(os.path.dirname(__file__))  

# Define the database - we are working with
# SQLite for this example
relPath  =  '../_db/quassel-storage.sqlite'

fullPath = os.path.join(BASE_DIR, relPath)

#print ('exists: ' + str(os.path.exists(fullPath)))
print ('opening ' + os.path.abspath( fullPath))

SQLALCHEMY_DATABASE_URI = 'sqlite:///' + fullPath + '?check_same_thread=False' #+ '?mode=ro'
SQLALCHEMY_ECHO=False
DATABASE_CONNECT_OPTIONS = { 
    #'check_same_thread': False
     }



# Application threads. A common general assumption is
# using 2 per available processor cores - to handle
# incoming requests using one and performing background
# operations using the other.
THREADS_PER_PAGE = 2

# Enable protection agains *Cross-site Request Forgery (CSRF)*
CSRF_ENABLED     = True

# Use a secure, unique and absolutely secret key for
# signing the data. 
CSRF_SESSION_KEY = "zs;dkfljngs'ael;rkgfnma;l'"

# Secret key for signing cookies
SECRET_KEY = "zs;dkfljngs'ael;rkgfnma;l"

DEBUG_MODE = True

SSL_SUPPORT = True
SSL_CERT_PATH = "ssl/cert.pem"
SSL_KEY_PATH = "ssl/cert.key"

LISTEN_PORT = 8888
LISTEN_ADDR = "0.0.0.0"
