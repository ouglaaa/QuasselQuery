from flask_wtf import Form
from wtforms import SelectField, TextField, fields
from wtforms.ext.sqlalchemy.fields import QuerySelectField

from .model import *

class MainForm(Form):

    network  = QuerySelectField('network', 
                                get_label=lambda x: x.NetworkName, 
                                query_factory=lambda :Network.GetNetworksForUserId(1))
    

    buffer  = QuerySelectField('buffer', 
                                get_label=lambda x: x.BufferName, 
                                query_factory=lambda :Buffer.GetBuffersForNetworkId(1))
    
    