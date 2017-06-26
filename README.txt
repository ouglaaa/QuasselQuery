
QuasselQuery is a self-hosted search page for the quassel core sqlite database.( http://quassel-irc.org/ )

It relies on a small html/js website plugged and hosted by a python backend (flask / sqlalchemy)



config:
python:
edit config.py 
    --> change path to quassel-storage.sqlite
    --> change SECRET variables
        - something random for secret signing
        - something you wish for login / password
    --> config SSL
        - SSL_SUPPORT : True | False
        - SSL_CERT_PATH / SSL_KEY_PATH: path to your certificats (can be simlink or whatever)(if used)
    --> change DEBUG_MODE | LISTEN_PORT | LISTEN_ADDR addr / port to your taste

service:
/!\ user must have read permissions on database quassel-storage.sqlite path /!\ 
edit scripts/startup 
    --> change settings of paths and users (tagged CHANGEME)
edit scripts/quasselquery 
    --> change settings of ExecStart, User, Group 

#########################

deploy / install:

python:
install python3-setuptools (for pip)
install python lib dependencies: (As root or demerde yourselves)
> pip3 install -r requirements.txt 

service:
# SysVinit
cp scripts/startup /etc/init.d/quasselquery
# systemd
cp scripts/quasselquery.service /lib/systemd/system/quasselquery.service

chmod +x   /etc/init.d/quasselquery

#########################

SSL:
sudo apt-get install certbot
(install ta vie)










##########################

access:
http://hostname:port/main



