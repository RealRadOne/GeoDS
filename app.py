import json
import numpy as np
import pandas as pd
from flask import Flask, jsonify, render_template,request,send_from_directory
from rsciio.phenom import file_reader
from scipy.ndimage import zoom

app = Flask(__name__, static_url_path='/static')

DATA_FILE_PATH = "Map_Data.csv"
ELID_FILE_PATH = "/home/sakshis/Matraca/Matraca/C2_10-12-2023/C2_10-12-2023.elid"
PROCESSED_JSON = "processed_data.json"

eds_data = None
sem_image_rgb = None
spectrum = None
energy_scale = None
scale_factors = None
eds_data_shape = None
sem_image_shape = None


def load_and_process_file(filepath):
    datasets = file_reader(filepath)
    sem_image, eds_data, energy_scale = None, None, None

    for dataset in datasets:
        data, axes = dataset['data'], dataset['axes']

        if data.ndim == 2 and sem_image is None:
            sem_image = data
            sem_image_rgb = np.stack([sem_image] * 3, axis=-1)
        elif data.ndim == 3 and eds_data is None:
            energy_axis = next((ax for ax in axes if ax['name'] == 'X-ray energy'), None)
            if energy_axis:
                energy_scale = np.linspace(
                    energy_axis['offset'],
                    energy_axis['offset'] + energy_axis['scale'] * (energy_axis['size'] - 1),
                    energy_axis['size']
                )
                eds_data = data

    if sem_image is not None and eds_data is not None:
        sem_image_shape, eds_data_shape = sem_image.shape, eds_data.shape[:2]
        scale_factors = (
            sem_image_shape[0] / eds_data_shape[0], 
            sem_image_shape[1] / eds_data_shape[1]
        )
        rescaled_eds_map = zoom(eds_data.sum(axis=2), scale_factors, order=1)
        spectrum = eds_data.sum(axis=(0, 1))

     # Prepare JSON-serializable data
    processed_data = {
        'sem_image': sem_image.tolist() if sem_image is not None else None,
        'sem_image_rgb': sem_image_rgb.tolist() if sem_image_rgb is not None else None,
        'eds_data': eds_data.tolist() if eds_data is not None else None,
        'rescaled_eds_map': rescaled_eds_map.tolist() if 'rescaled_eds_map' in locals() else None,
        'spectrum': spectrum.tolist() if 'spectrum' in locals() else None,
        'energy_scale': energy_scale.tolist() if energy_scale is not None else None
    }

    print(f"Processed data: {processed_data}")

    with open(PROCESSED_JSON, 'w') as f:
        json.dump(processed_data, f)

    return eds_data
    
def process_pixel(eds_data,sem_image,sem_x, sem_y):
    eds_data_shape = eds_data.shape
    sem_image_shape = sem_image.shape

    eds_x = int(sem_x * eds_data_shape[1] / sem_image_shape[1])
    eds_y = int(sem_y * eds_data_shape[0] / sem_image_shape[0])

    eds_x = np.clip(eds_x, 0, eds_data.shape[1] - 1)
    eds_y = np.clip(eds_y, 0, eds_data.shape[0] - 1)

    pixel_spectrum = eds_data[eds_y, eds_x, :]

    return pixel_spectrum

def preprocess(DATA_FILE_PATH):
    df = pd.read_csv(DATA_FILE_PATH)
    df[['XRegion', 'YRegion']] = df['New_Region'].str.split(',', expand=True).astype(float)
    df['Element'] = df['Element'].astype('category')
    df.dropna(inplace=True)
    return df

pre_data = preprocess(DATA_FILE_PATH)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process_and_load')
def process_and_load():
    try:
        final_df = load_and_process_file(ELID_FILE_PATH)
        data = final_df.to_dict()
        json_data = jsonify(data)
        return json_data
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/show_location_data')
def show_elbow_data():
    try:
        data = pre_data.to_dict()
        json_data = jsonify(data)
        return json_data
    except Exception as e:
        return jsonify({'error': str(e)})
    
@app.route('/show_elid_data')
def show_elid_data():
    try:
        with open(PROCESSED_JSON, 'r') as f:
            data = json.load(f)
        
        if 'sem_image' in data:
            data_list = data['sem_image']
            print(f"Data list: {data_list}")
            json_data = json.dumps(data_list)
            return json_data
        else:   
            return jsonify({'error': 'Error reading ELID file'})
    except Exception as e:
        print(f"Unexpected error: {e}")  
        return jsonify({'error': 'Unexpected error occurred'}), 500
    
@app.route('/show_pixel_data',methods=['POST'])
def process_pixel_data():
    try:
        data = request.get_json()

        eds_data = None
        sem_image = None

        with open(PROCESSED_JSON, 'r') as f:
            json_data = json.load(f)
            eds_data = np.array(json_data['eds_data'])
            sem_image = np.array(json_data['sem_image'])
        
        sem_x = data['x']
        sem_y = data['y']

        pixel_spectrum = process_pixel(eds_data, sem_image, sem_x, sem_y)

        pixel_spectrum_json = jsonify(pixel_spectrum.tolist())
        print(pixel_spectrum_json)
        return pixel_spectrum_json
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
