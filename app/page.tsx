'use client';
import { Fullscreen, Upload, X, Send, RefreshCw } from "lucide-react";
import React, { useState, useRef } from "react";

const ImageUploadPage = () => {
  const [image, setImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [detections, setDetections] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Check if the file is an image with acceptable extensions
    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (!acceptedTypes.includes(file.type)) {
      setResultMessage("Please upload only .jpg or .png files");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setResultImage(null); // Clear previous result
      setDetections([]);
      setResultMessage("");
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleRemoveImage = () => {
    setImage(null);
    setResultImage(null);
    setDetections([]);
    setResultMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendImageToEndpoint = async () => {
    if (!image) return;
    
    setIsLoading(true);
    setResultMessage("Analyzing image...");
    
    try {
      // The base64 string is already in the image state
      // Removing the prefix (data:image/jpeg;base64,) if needed
      const base64Data = image.split(',')[1];
      
      // Make API call to your backend
      const response = await fetch('http://127.0.0.1:5000/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_base64: base64Data }),
      });
      
      if (response.ok) {
        const responseData = await response.json();
        const result = responseData.results; // Access the results property
        
        if (result.error) {
          setResultMessage(`Error: ${result.error}`);
        } else {
          // Set the visualization image
          if (result.visualization) {
            setResultImage(`data:image/jpeg;base64,${result.visualization}`);
          }
          
          // Set detections data
          if (result.detections && result.detections.length > 0) {
            setDetections(result.detections);
            
            // Find the highest confidence prediction
            const bestDetection = result.detections.reduce((prev, current) => 
              (prev.confidence > current.confidence) ? prev : current
            );
            
            setResultMessage(`Detected: ${bestDetection.ripeness} (${(bestDetection.confidence * 100).toFixed(1)}% confidence)`);
          } else {
            setResultMessage("No detections found. Try a clearer image.");
          }
        }
      } else {
        setResultMessage("Error processing the image. Please try again.");
      }
    } catch (error) {
      console.error("API error:", error);
      setResultMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResultImage(null);
    setDetections([]);
    setResultMessage("");
  };

  return (
    <div className="bg-gradient-to-b from-teal-600 to-teal-800 min-h-screen w-full pt-12 pb-12 flex flex-col items-center gap-8">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4 px-4">
        <h1 className="font-bold text-4xl text-white text-center">
          Pineapple Ripeness Detection
        </h1>
        <p className="text-white text-lg text-center">
          Upload a pineapple image to analyze its ripeness level
        </p>
      </div>

      {/* Input area - hide when showing results */}
      {!resultImage && (
        <div 
          className={`relative cursor-pointer w-full max-w-xl mx-4 h-80 flex flex-col items-center justify-center gap-4 rounded-xl transition-all duration-300 ${
            isDragging 
              ? "bg-white border-4 border-dashed border-teal-400" 
              : image 
                ? "bg-gray-100 border-none" 
                : "bg-white/10 backdrop-blur-sm border-2 border-dashed border-white hover:bg-white/20"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={image ? null : handleUploadClick}
        >
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInputChange}
            accept=".jpg,.jpeg,.png"
          />
          
          {!image ? (
            <>
              <Upload className="w-16 h-16 text-white" />
              <p className="text-lg text-white font-medium">Drag & Drop or Click to Upload</p>
              <p className="text-sm text-white/80">Accepted Types: .jpg, .png</p>
            </>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={image} 
                alt="Uploaded pineapple" 
                className="max-h-full max-w-full object-contain rounded-lg"
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Result visualization */}
      {resultImage && (
        <div className="w-full max-w-xl mx-4 rounded-xl overflow-hidden bg-white shadow-lg">
          <div className="relative">
            <img 
              src={resultImage} 
              alt="Analysis result" 
              className="w-full object-contain"
            />
            <button 
              onClick={resetAnalysis}
              className="absolute top-2 right-2 bg-white text-teal-600 p-2 rounded-full hover:bg-gray-100 transition-colors shadow-md"
            >
              <RefreshCw size={20} />
            </button>
          </div>
          
          <div className="p-4 bg-white">
            <h3 className="font-bold text-lg text-teal-800">Analysis Results</h3>
            <p className={`mt-2 font-medium ${
              resultMessage.includes("Error") || resultMessage.includes("No detections") 
                ? "text-red-600" 
                : "text-teal-600"
            }`}>
              {resultMessage}
            </p>
            
            {detections.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700">All Detections:</h4>
                <div className="mt-2 space-y-2">
                  {detections.map((detection, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{detection.ripeness}</span>
                      <span className="text-sm bg-teal-100 text-teal-800 px-2 py-1 rounded">
                        {(detection.confidence * 100).toFixed(1)}% confidence
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action button - show only when image is uploaded but not analyzed */}
      {image && !resultImage && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={sendImageToEndpoint}
            disabled={isLoading}
            className="cursor-pointer flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-3 px-6 rounded-full transition-all duration-300 shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <Send size={18} />
                Analyze Ripeness
              </>
            )}
          </button>
          
          {resultMessage && !resultImage && (
            <div className={`mt-4 p-4 rounded-lg text-center ${
              resultMessage.includes("Error") || resultMessage.includes("Please upload only") 
                ? "bg-red-100 text-red-800" 
                : "bg-green-100 text-green-800"
            }`}>
              {resultMessage}
            </div>
          )}
        </div>
      )}
      
      {/* Upload new image button when showing results */}
      {resultImage && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => {
              setResultImage(null);
              setDetections([]);
              setResultMessage("");
            }}
            className="cursor-pointer flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-6 rounded-full transition-all duration-300 shadow-lg"
          >
            <Upload size={18} />
            Upload New Image
          </button>
        </div>
      )}
      
      <div className="mt-4 text-white/70 text-sm max-w-md text-center">
        Our AI will analyze your pineapple image and determine its ripeness level. For best results, ensure the pineapple is clearly visible and well-lit.
      </div>
    </div>
  );
};

export default ImageUploadPage;