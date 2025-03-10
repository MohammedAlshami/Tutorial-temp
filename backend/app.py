
# Importing the required libraries
import flask
from flask import request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import base64
import cv2


# Loading the model
model = YOLO("pineapple_ripe.pt")


# Creating the Flask app
app = flask.Flask(__name__)

# Enabling CORS
CORS(app)



def run_inference(image_base64):
    try:
        # Decode the base64 string
        image_data = base64.b64decode(image_base64)
        
        # Save the image
        image_path = "image.jpg"
        with open(image_path, "wb") as f:
            f.write(image_data)
        
        # Running inference
        results = model(image_path, save=True)  # save=True saves the visualization
        
        # Extract results
        result_dict = {}
        if results and len(results) > 0:
            # Get the first result (assuming single image input)
            result = results[0]
            
            # Get the visualized image with bounding boxes
            # YOLO saves this to 'runs/detect/predict/image.jpg' by default
            # You might need to adjust this path based on your YOLO version
            try:
                # Try to get the plot directly from results
                plot_img = result.plot()  # This gets the numpy array with the plot
                
                # Convert numpy array to base64
                _, buffer = cv2.imencode('.jpg', plot_img)
                detected_image = base64.b64encode(buffer).decode('utf-8')
            except:
                # Fallback: read the saved image
                try:
                    # Path might vary based on YOLO version and run count
                    viz_path = "runs/detect/predict/image.jpg"
                    with open(viz_path, "rb") as img_file:
                        detected_image = base64.b64encode(img_file.read()).decode('utf-8')
                except Exception as viz_error:
                    print(f"Visualization error: {viz_error}")
                    detected_image = None
            
            # Convert boxes and class predictions to a serializable format
            if hasattr(result, 'boxes') and result.boxes is not None:
                boxes = result.boxes
                result_dict['detections'] = []
                
                for i, box in enumerate(boxes):
                    # Extract class, confidence and box coordinates
                    cls_id = int(box.cls.item()) if hasattr(box, 'cls') else None
                    conf = float(box.conf.item()) if hasattr(box, 'conf') else None
                    
                    # Get class name if available
                    cls_name = result.names[cls_id] if cls_id is not None and hasattr(result, 'names') else f"class_{cls_id}"
                    
                    # Add to results
                    result_dict['detections'].append({
                        'ripeness': cls_name,
                        'confidence': conf,
                        'box': box.xyxy.tolist()[0] if hasattr(box, 'xyxy') else None
                    })
            
            # Add the visualization to the main result
            result_dict['visualization'] = detected_image
        
        return result_dict
    
    except Exception as e:
        print(f"Error in inference: {e}")
        return {"error": str(e)}


@app.route('/', methods=['POST'])
def index():
    response = request.get_json()
    image_base64 = response['image_base64']
    results = run_inference(image_base64)
    return jsonify({"results": results})


# if __name__ == "__main__":
#     app.run(debug=True)



