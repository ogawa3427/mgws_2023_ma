from flask import Flask, render_template, redirect
import os
import re
import json
import csv
import time
from flask import jsonify

app = Flask(__name__)

qur = '2023q4.json'

app.json.ensure_ascii = False



@app.route('/')
def index():
    return render_template(
        'index.html',


        mode = 'hose'
    )

@app.route('/mgws')
def mgws():
    return render_template(
        'mgws.html',


        mode = 'hose'
    )
if __name__ == "__app__":
    app.run(host="0.0.0.0", port=80)

    app = Flask(__name__)