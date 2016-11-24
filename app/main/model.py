# -*- coding: utf-8 -*-
"""
Quassel* related model.

"""
import os
from datetime import datetime
from hashlib import sha256
__all__ = ['Sender', 'Backlog', 'Buffer', 'User', 'Network', 'Identity', 

           ]

from sqlalchemy import Table, ForeignKey, Column
from sqlalchemy.types import Unicode, Integer, DateTime, String
from sqlalchemy.orm import relation, synonym, column_property, relationship,\
    backref
from sqlalchemy.ext.hybrid import hybrid_property

from app import db
DeclarativeBase=db.Model

 
class Sender(DeclarativeBase):
    __tablename__ = 'sender'
    SenderId = Column('senderid', Integer, primary_key=True)
    SenderIdent = Column('sender', Unicode)

class Buffer(DeclarativeBase):
    __tablename__ = 'buffer'
    BufferId = Column('bufferid', Integer, primary_key=True)
    UserId = Column('userid', Integer, ForeignKey('quasseluser.userid'))
    GroupId = Column('groupid', Integer)
    NetworkId = Column('networkid', Integer, ForeignKey('network.networkid'))
    BufferName = Column('buffername', Unicode)
    BufferCName = Column('buffercname', Unicode)
    BufferType = Column('buffertype', Integer)
    Joined = Column('joined', Integer)
    
    

class Network(DeclarativeBase):
    __tablename__ = 'network'
    NetworkId = Column('networkid', Integer, primary_key=True)
    NetworkName = Column('networkname', Unicode)
    IdentityId = Column('identityid', Integer, ForeignKey('identity.identityid'))
    Buffers = relationship(Buffer, primaryjoin=NetworkId == Buffer.NetworkId, lazy='immediate')

    

class Identity(DeclarativeBase):
    __tablename__ = 'identity'
    IdentityId = Column('identityid', Integer, primary_key=True)
    UserId = Column('userid', Integer)
    IdentityName = Column('identityname', Unicode)
    Networks = relation(Network, primaryjoin=IdentityId == Network.IdentityId, lazy='immediate')
    



class User(DeclarativeBase):
    __tablename__ = 'quasseluser'
    UserId = Column('userid', Integer, primary_key=True)
    UserName = Column('username', Unicode)
    Password = Column('password', Unicode)
    HashVersion = Column('hashversion', Integer)
#     Identities = relationship(Identity, primaryjoin=UserId==Identity.UserId, lazy='immediate')

class Backlog(DeclarativeBase):
    __tablename__ = 'backlog'
    MessageId = Column('messageid', Integer, primary_key=True)
    Time = Column('time', Integer)
    BufferId = Column('bufferid', Integer, ForeignKey('buffer.bufferid'))
    Type = Column('type', Integer)
    Flags = Column('flags', Integer)
    SenderId = Column('senderid', Integer, ForeignKey('sender.senderid'))
    Message = Column('message', Unicode)

    Sender = relation(Sender, primaryjoin=SenderId == Sender.SenderId, lazy='immediate')

import json
class CurrentUser:
    UserId = ""
    UserName = ""
    Token = ""
    def __init__(self, userId, userName):
        CurrentUser.UserId = userId
        CurrentUser.UserName = userName
    
    def toJSON(self):
        obj = { 
            'UserId': CurrentUser.UserId,
            'UserName': CurrentUser.UserName,
            'Token': CurrentUser.Token,            
        }
        return json.dumps(obj, default=lambda o: o.__dict__, 
            sort_keys=True, indent=4)