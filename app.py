import json
import numpy as np
import pandas as pd
from flask import request
from flask import Flask, jsonify, render_template

app = Flask(__name__, static_url_path='/static')

selected_order = {}
k = 5

DATA_FILE_PATH = "/home/radone/Timesheets/Map_Data.csv"


def preprocess(DATA_FILE_PATH):
    df = pd.read_csv(DATA_FILE_PATH)
    df[['XRegion','YRegion']] = df['New_Region'].str.split(',',expand=True).astype(float)
    df['Element'] = df['Element'].astype('category')
    df.dropna(inplace=True)
    print(df.shape)
    return df

pre_data = preprocess(DATA_FILE_PATH)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/show_location_data')
def show_elbow_data():
    try:
        data = pre_data.to_dict()
        json_data = jsonify(data) 
        print(json_data)
        return json_data
    except Exception as e:
        return jsonify({'error': str(e)})
 
if __name__ == '__main__':
    app.run(debug=True)

