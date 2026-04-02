# -*- encoding: utf-8 -*-
"""
Copyright (c) App-Generator.dev | AppSeed.us
"""

import os
from .common   import *
from .h_files  import *
from .h_util   import *


def _manage_cmd(args):
    return 'python ' + FILE_DJ_MANAGE_s + ' ' + args
    
def check_migrations():
    try:
        
        if 0 == exec_process(_manage_cmd('makemigrations --check --dry-run')):
            return True 
        
        return False

    except Exception as e:
        print(' > ERR: ' + str(e) )
        return -1

def exec_migration():
    try:
        
        if 0 == exec_process(_manage_cmd('makemigrations')):
            if 0 == exec_process(_manage_cmd('migrate')):
                return True 
        
        return False

    except Exception as e:
        print(' > ERR: ' + str(e) )
        return -1

def create_admin():
    try:
        
        if 0 == exec_process(_manage_cmd('createsuperuser')):
            return True 
        
        return False

    except Exception as e:
        print(' > ERR: ' + str(e) )
        return -1
        
def exec_project_start(aPort=8000):
    try:
        
        if 0 == exec_process(_manage_cmd('runserver ' + str(aPort))):
            return True 
        
        return False

    except Exception as e:
        print(' > ERR: ' + str(e) )
        return -1

def exec_project_shell():
    try:
        
        if 0 == exec_process(_manage_cmd('shell')):
            return True 
        
        return False

    except Exception as e:
        print(' > ERR: ' + str(e) )
        return -1

def exec_format_code( aFilePath ):
    try:
        
        if 0 == exec_process('black ' + aFilePath ):
            return True 
        
        return False

    except Exception as e:
        print(' > ERR: ' + str(e) )
        return -1
