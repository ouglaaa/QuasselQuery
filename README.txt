config:
python:
edit config.py --> change path to quassel-storage.sqlite
edit run.py --> set port to whatever you wish

service:
/!\ user must have read permissions on database quassel-storage.sqlite path /!\ 
edit scripts/startup --> change settings of paths and users (tagged CHANGEME)
edit scripts/quasselquery --> change settings of ExecStart, User, Group 

#########################

deploy / install:
python:
install python lib dependencies:
> pip3 install -r requirements.txt 

service:
# SysVinit
cp scripts/startup /etc/init.d/quasselquery
# systemd
cp scripts/quasselquery.service /lib/systemd/system/quasselquery.service

chmod +x   /etc/init.d/quasselquery

#########################

access:
http://hostname:port/main

