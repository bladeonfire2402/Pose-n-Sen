"use client";

import AppContext from "@/contexts/app";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { PhotoBoothScreenWrapper } from "./styled";

const PhotoBoothScreen = () => {
  const navigate = useRouter();
  const videoRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);
  const fileInputRef = useRef<any>(null);

  const [capturedImages, setImages] = useState<any>([]);
  const [filter, setFilter] = useState<any>("none");
  const [cssFilter, setCssFilter] = useState<any>(""); // Add this line
  const [countdown, setCountdown] = useState<any>(null);
  const [capturing, setCapturing] = useState<any>(false);
  const [isMobile, setIsMobile] = useState<any>(false);
  const [countdownTime, setCountdownTime] = useState<any>(5);
  const { setCapturedImages } = useContext(AppContext);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mode, setMode] = useState("capture");

  const requiredPhotos = 4; // Number of photos required for the photo strip

  useEffect(() => {
    startCamera();

    const checkMobile = () => {
      const win = window as any;

      const userAgent = navigator.userAgent || navigator.vendor || win.opera;
      const mobileRegex = /android|ipad|iphone|ipod|windows phone/i;
      setIsMobile(mobileRegex.test(userAgent));
    };

    checkMobile();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        startCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track: any) => track.stop());
      }
    };
  }, []);

  // Start Camera
  const startCamera = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        return;
      }

      const constraints = {
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: isMobile ? 1280 : 1280 },
          height: { ideal: isMobile ? 720 : 720 },
          frameRate: { ideal: 30 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (err) {
          console.error("Error playing video:", err);
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access your camera. Please ensure camera permissions are granted in your browser settings.");
    }
  };

  // apply fitler using canvas api
  const applyFilterToCanvas = (sourceCanvas: any, filterType: any) => {
    const ctx = sourceCanvas.getContext("2d");

    // Save the original image data before applying filters
    const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const data = imageData.data;

    switch (filterType) {
      case "brighten":
        // Soft effect with adjusted brightness, contrast, saturation and a little blur
        for (let i = 0; i < data.length; i += 4) {
          // Điều chỉnh độ sáng (brightness)
          data[i] = Math.min(255, data[i] * 1.05); // R component
          data[i + 1] = Math.min(255, data[i + 1] * 1.05); // G component
          data[i + 2] = Math.min(255, data[i + 2] * 1.05); // B component

          // Điều chỉnh độ tương phản nhẹ (contrast)
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = data[i] * 0.95 + avg * 0.05; // R component with reduced contrast
          data[i + 1] = data[i + 1] * 0.95 + avg * 0.05; // G component with reduced contrast
          data[i + 2] = data[i + 2] * 0.95 + avg * 0.05; // B component with reduced contrast

          // Điều chỉnh độ bão hòa nhẹ (saturation)
          const avgColor = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = data[i] * 1.05 + avgColor * 0.05; // Apply soft saturation effect
          data[i + 1] = data[i + 1] * 1.05 + avgColor * 0.05;
          data[i + 2] = data[i + 2] * 1.05 + avgColor * 0.05;
        }
        break;
      case "smooth":
        // Soft effect with adjusted brightness, contrast, saturation, and slight blur
        for (let i = 0; i < data.length; i += 4) {
          // Điều chỉnh độ sáng (brightness) - tăng nhẹ độ sáng 105%
          data[i] = Math.min(255, data[i] * 1.1); // R component
          data[i + 1] = Math.min(255, data[i + 1] * 1.1); // G component
          data[i + 2] = Math.min(255, data[i + 2] * 1.1); // B component

          // Điều chỉnh độ tương phản (contrast) - giảm 15% độ tương phản (85%)
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = data[i] * 0.95 + avg * 0.05; // R component
          data[i + 1] = data[i + 1] * 0.95 + avg * 0.05; // G component
          data[i + 2] = data[i + 2] * 0.95 + avg * 0.05; // B component

          // // Điều chỉnh độ bão hòa (saturation) - giảm độ bão hòa nhẹ
          // const avgColor = (data[i] + data[i + 1] + data[i + 2]) / 3;

          // // Giảm bão hòa tổng thể một chút
          // data[i] = data[i] * 0.9 + avgColor * 0.1; // Giảm bão hòa cho màu đỏ (R)
          // data[i + 1] = data[i + 1] * 0.95 + avgColor * 0.05; // Giảm bão hòa cho màu xanh lá (G)
          // data[i + 2] = data[i + 2] * 0.95 + avgColor * 0.05; // Giảm bão hòa cho màu xanh dương (B)

          // // Điều chỉnh HSL cho màu đỏ (tăng saturation)
          // if (data[i] > data[i + 1] && data[i] > data[i + 2]) {
          //   // Nếu là màu đỏ (R)
          //   data[i] = Math.min(255, data[i] * 1.1); // Tăng saturation cho màu đỏ
          // }

          // Điều chỉnh HSL cho màu vàng (giảm saturation và tăng lightness)
          // if (data[i + 1] > data[i] && data[i + 2] > data[i]) {
          //   // Nếu là màu vàng (G + B > R)
          //   data[i + 1] = data[i + 1] * 0.85; // Giảm saturation cho màu vàng
          //   data[i + 2] = Math.min(255, data[i + 2] * 1.05); // Tăng lightness cho màu vàng
          // }

          // Giảm warmth (giảm độ ấm cho màu đỏ)
          data[i] = Math.min(255, data[i] * 0.95); // Giảm bớt độ ấm cho màu đỏ (R)

          // Tăng tint cho màu đỏ (tạo hiệu ứng đỏ mạnh hơn)
          data[i] = Math.min(255, data[i] * 1.05); // Tăng tint cho màu đỏ (R)

          // // Hoặc tăng tint cho màu xanh lá (G)
          // data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Tăng tint cho màu xanh lá (G)

          // // Tăng độ đen (black) bằng cách làm tối các kênh màu
          // // Giảm giá trị các kênh màu để làm tăng độ tối (black)
          // data[i] = data[i] * 0.8; // Tăng đen cho màu đỏ (R)
          // data[i + 1] = data[i + 1] * 0.8; // Tăng đen cho màu xanh lá (G)
          // data[i + 2] = data[i + 2] * 0.8; // Tăng đen cho màu xanh dương (B)

          // // Thêm highlights (Tăng sáng cho các vùng sáng)
          // // Tăng các kênh màu nếu giá trị của chúng đã cao (tạo điểm sáng nổi bật)
          // if (data[i] > 200) {
          //   // Nếu là vùng sáng của màu đỏ (R)
          //   data[i] = Math.min(255, data[i] * 1.1); // Tăng độ sáng của màu đỏ
          // }
          // if (data[i + 1] > 200) {
          //   // Nếu là vùng sáng của màu xanh lá (G)
          //   data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Tăng độ sáng của màu xanh lá
          // }
          // if (data[i + 2] > 200) {
          //   // Nếu là vùng sáng của màu xanh dương (B)
          //   data[i + 2] = Math.min(255, data[i + 2] * 1.1); // Tăng độ sáng của màu xanh dương
          // }
        }
        break;
      case "cold":
        for (let i = 0; i < data.length; i += 4) {
          // Điều chỉnh độ sáng (brightness) - giảm 5% độ sáng (95%)
          data[i] = Math.min(255, data[i] * 0.95); // R component
          data[i + 1] = Math.min(255, data[i + 1] * 0.95); // G component
          data[i + 2] = Math.min(255, data[i + 2] * 0.95); // B component

          // Điều chỉnh độ tương phản (contrast) - giảm 10% độ tương phản (90%)
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = data[i] * 0.9 + avg * 0.1; // R component
          data[i + 1] = data[i + 1] * 0.9 + avg * 0.1; // G component
          data[i + 2] = data[i + 2] * 0.9 + avg * 0.1; // B component

          // Điều chỉnh độ bão hòa (saturation) - tăng độ bão hòa 10% (110%)
          const avgColor = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = data[i] * 1.1 + avgColor * 0.1; // R component
          data[i + 1] = data[i + 1] * 1.1 + avgColor * 0.1; // G component
          data[i + 2] = data[i + 2] * 1.1 + avgColor * 0.1; // B component

          // Làm giảm độ ấm của màu đỏ (R) để tạo hiệu ứng lạnh hơn
          data[i] = Math.min(255, data[i] * 0.9); // Giảm độ ấm cho màu đỏ (R)
        }
        break;

      default:
        break;
    }

    ctx.putImageData(imageData, 0, 0);
    return sourceCanvas;
  };

  useEffect(() => {
    switch (filter) {
      case "brighten":
        setCssFilter("brightness(105%) contrast(95%) saturate(110%)");
        break;
      case "smooth":
        setCssFilter("brightness(102%) contrast(85%) saturate(103%)");
        break;
      case "cold":
        setCssFilter("brightness(94%) contrast(100%) saturate(110%) hue-rotate(15deg) ");
        break;
      default:
        setCssFilter(filter);
        break;
    }
  }, [filter]);

  // Countdown to take 4 pictures automatically
  const startCountdown = () => {
    if (capturing) return;
    setCapturing(true);

    setImages([]);

    let photosTaken = 0;
    const newCapturedImages: any = [];

    const captureSequence = async () => {
      if (photosTaken >= 4) {
        setCountdown(null);
        setCapturing(false);

        try {
          setCapturedImages([...newCapturedImages]);
          setTimeout(() => {
            navigate.push("/preview");
          }, 300);
        } catch (error) {
          console.error("Error navigating to preview:", error);
          // If navigation fails, at least display the images
          setImages([...newCapturedImages]);
        }
        return;
      }

      let timeLeft = countdownTime;
      setCountdown(timeLeft);

      const timer = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);

        if (timeLeft === 0) {
          clearInterval(timer);
          const imageUrl = capturePhoto();
          if (imageUrl) {
            newCapturedImages.push(imageUrl);
            setImages((prevImages: any) => [...prevImages, imageUrl]);
          }
          photosTaken += 1;
          setTimeout(captureSequence, 1000);
        }
      }, 1000);
    };

    captureSequence();
  };

  // Capture Photo
  const capturePhoto = () => {
    const video: any = videoRef.current;
    const canvas: any = canvasRef.current;

    if (video && canvas) {
      const context = canvas.getContext("2d");

      console.log("Device Info:", {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        touchPoints: navigator.maxTouchPoints,
        isMobile,
      });

      const targetWidth = video.videoWidth;
      const targetHeight = video.videoHeight;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const videoRatio = video.videoWidth / video.videoHeight;
      const targetRatio = targetWidth / targetHeight;

      let drawWidth = video.videoWidth;
      let drawHeight = video.videoHeight;
      let startX = 0;
      let startY = 0;

      if (videoRatio > targetRatio) {
        drawWidth = drawHeight * targetRatio;
        startX = (video.videoWidth - drawWidth) / 2;
      } else {
        drawHeight = drawWidth / targetRatio;
        startY = (video.videoHeight - drawHeight) / 2;
      }

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight;
      const tempCtx: any = tempCanvas.getContext("2d");

      // Draw the original image first
      tempCtx.save();
      tempCtx.translate(tempCanvas.width, 0);
      tempCtx.scale(-1, 1);
      tempCtx.drawImage(video, startX, startY, drawWidth, drawHeight, 0, 0, targetWidth, targetHeight);
      tempCtx.restore();

      // Flip canvas for mirroring
      context.save();

      if (filter !== "none") {
        applyFilterToCanvas(tempCanvas, filter);
      }

      // Draw the processed image to the main canvas
      context.drawImage(tempCanvas, 0, 0);

      return canvas.toDataURL("image/png");
    }
  };

  // Handle file uploads
  const handleFileUpload = (e: any) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Clear existing uploads if any
    setUploadedImages([]);
    setImages([]);

    // Cap at required photos based on layout
    const filesToProcess = files.slice(0, requiredPhotos);
    setUploadProgress(0);

    const processedImages: any = [];
    let processed = 0;

    filesToProcess.forEach((file: any, index) => {
      // Check if file is an image
      if (!file.type.match("image.*")) {
        alert(`File ${file.name} is not an image. Please upload only image files.`);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e: any) => {
        // Create an image to get dimensions
        const img: any = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx: any = canvas.getContext("2d");

          const originalWidth = img.width;
          const originalHeight = img.height;
          // Use 3:4 aspect ratio for photo strip
          canvas.width = originalWidth;
          canvas.height = originalHeight;

          // Fill with white background first
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Calculate how to fit and center the image
          let drawWidth, drawHeight, startX, startY;
          const imageRatio = img.width / img.height;
          const canvasRatio = canvas.width / canvas.height;

          if (imageRatio > canvasRatio) {
            // Image is wider than canvas ratio
            drawHeight = canvas.height;
            drawWidth = img.width * (canvas.height / img.height);
            startX = (canvas.width - drawWidth) / 2;
            startY = 0;
          } else {
            // Image is taller than canvas ratio
            drawWidth = canvas.width;
            drawHeight = img.height * (canvas.width / img.width);
            startX = 0;
            startY = (canvas.height - drawHeight) / 2;
          }

          // Draw the image centered
          ctx.drawImage(img, startX, startY, drawWidth, drawHeight);

          // Apply any selected filter
          if (filter !== "none") {
            applyFilterToCanvas(canvas, filter);
          }

          const processedUrl = canvas.toDataURL("image/jpeg", 1);
          processedImages[index] = processedUrl;

          processed++;
          setUploadProgress(Math.round((processed / filesToProcess.length) * 100));

          // When all images are processed, update state
          if (processed === filesToProcess.length) {
            // Filter out any undefined entries
            const filteredImages = processedImages.filter((img: any) => img);
            setUploadedImages(filteredImages);
            setImages(filteredImages);

            // If we have fewer than required photos, tell the user
            //if (filteredImages.length < requiredPhotos) {
            //alert(
            //`You've uploaded ${filteredImages.length} image${filteredImages.length !== 1 ? "s" : ""}. For the best photo strip, please upload exactly ${requiredPhotos} images.`
            //);

            // return;
            //}
          }
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  };

  // Switch mode between capture and upload
  const switchMode = (newMode: string) => {
    setMode(newMode);
    setImages([]);
    setUploadedImages([]);
    setUploadProgress(0);

    if (newMode === "capture") {
      startCamera();
    } else {
      stopCamera();
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track: any) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Proceed to preview with uploaded images
  const proceedToPreview = () => {
    if (uploadedImages.length <= 3) {
      alert("Please upload 4 images to create a photo strip.");
      return;
    }

    setCapturedImages([...uploadedImages]);
    navigate.push("/preview");
  };

  return (
    <PhotoBoothScreenWrapper>
      <div className="photo-booth">
        {/*
        
        <div
          className="mode-selection"
          style={{ marginTop: "40px", marginBottom: "20px", display: "flex", gap: "16px" }}
        >
          <button
            onClick={() => switchMode("capture")}
            className={mode === "capture" ? "active-mode" : ""}
            style={{
              backgroundColor: mode === "capture" ? "#000000" : "transparent",
              color: mode === "capture" ? "white" : "black",
              padding: "10px 16px",
              border: "2px solid #333",
              borderRadius: "25px",
              fontSize: "0.9rem",
              fontWeight: "bold",
              transition: "all 0.3s ease",
              width: "150px",
              maxWidth: "150px",
            }}
          >
            Camera
          </button>
          {capturing == false && (
            <button
              disabled={capturing}
              onClick={() => switchMode("upload")}
              className={mode === "upload" ? "active-mode" : ""}
              style={{
                backgroundColor: mode === "upload" ? "#000000" : "transparent",
                color: mode === "upload" ? "white" : "black",
                padding: "10px 16px",
                border: "2px solid #333",
                borderRadius: "25px",
                fontSize: "0.9rem",
                fontWeight: "bold",
                transition: "all 0.3s ease",
                width: "150px",
                maxWidth: "150px",
              }}
            >
              Upload Images
            </button>
          )}
        </div>
        */}
        <h1 className={`text-4xl font-bold mb-4 }`}>Camera</h1>
        {countdown !== null && <h2 className="countdown animate text-center">{countdown}</h2>}

        {mode === "capture" && (
          <div className="photo-container ">
  
            <div className="filters flex flex-col gap-2">
              <p className="text-filter">Filter</p>
              <button onClick={() => setFilter("none")} disabled={capturing}>
                Normal
              </button>

              <button onClick={() => setFilter("brighten")} disabled={capturing}>
                Brighten
              </button>

              <button onClick={() => setFilter("smooth")} disabled={capturing}>
                Smooth
              </button>

              <button onClick={() => setFilter("cold")} disabled={capturing}>
                Cold
              </button>
            </div>

            <div className="camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                disablePictureInPicture
                disableRemotePlayback
                className="video-feed"
                style={{
                  filter: cssFilter,
                  // width: "100%",
                  // height: "100%",
                  objectFit: "cover",
                }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="preview-side ml-5 ">
              {capturedImages.map((image: any, index: any) => (
                <img key={index} src={image} alt={`Captured ${index + 1}`} className="side-preview" />
              ))}
            </div>
          </div>
        )}

        {mode === "upload" && (
          <div className="upload-container" style={{ marginBottom: "20px" }}>
            <div className="upload-instructions" style={{ marginBottom: "15px" }}>
              <p>Choose {requiredPhotos} images from your photos to create a photo strip.</p>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              ref={fileInputRef}
              style={{ display: "none" }}
            />

            <button onClick={() => fileInputRef.current.click()} style={{ marginBottom: "15px" }}>
              Select Images
            </button>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress" style={{ marginBottom: "15px" }}>
                <div style={{ width: "100%", backgroundColor: "#f0f0f0", borderRadius: "10px", height: "10px" }}>
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      backgroundColor: "#ff9be4",
                      height: "10px",
                      borderRadius: "10px",
                      transition: "width 0.3s ease-in-out",
                    }}
                  />
                </div>
                <p style={{ fontSize: "0.8rem", marginTop: "5px" }}>Processing images: {uploadProgress}%</p>
              </div>
            )}

            {uploadedImages.length > 0 && (
              <div className="upload-preview-container" style={{ marginTop: "20px" }}>
                <h3>Uploaded Images</h3>
                <div
                  className="preview-side"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    gap: "10px",
                    marginTop: "10px",
                    alignItems: "center",
                  }}
                >
                  {uploadedImages.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Uploaded ${index + 1}`}
                      className="side-preview"
                      style={{
                        width: "160px",
                        height: "120px",
                        objectFit: "cover",
                        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                        marginBottom: "10px",
                      }}
                    />
                  ))}
                </div>

                <button onClick={proceedToPreview} style={{ marginTop: "20px" }} disabled={uploadedImages.length === 0}>
                  Continue to Photo Strip Editor
                </button>
              </div>
            )}
          </div>
        )}

        {mode === "capture" && (
          <>
            <div className="countdown-options">
              <label>Select Countdown Time:</label>
              <select
                onChange={(e) => setCountdownTime(parseInt(e.target.value))}
                value={countdownTime}
                disabled={capturing}
              >
                <option value={5}>5s</option>
                <option value={10}>10s</option>
              </select>
            </div>

            <div className="controls">
              <button onClick={startCountdown} disabled={capturing}>
                {capturing ? "Capturing..." : "Start Capture :)"}
              </button>
            </div>

            {/* Đây là một comment trong JSX 
            <p className="filter-prompt">Choose a filter before starting capture!</p>

            <div className="filters ">
              <button onClick={() => setFilter("none")} disabled={capturing}>
                Normal
              </button>

              <button onClick={() => setFilter("brighten")} disabled={capturing}>
                Brighten
              </button>

              <button onClick={() => setFilter("smooth")} disabled={capturing}>
                Smooth
              </button>

         
            </div>
            */}
          </>
        )}
      </div>
    </PhotoBoothScreenWrapper>
  );
};

export default PhotoBoothScreen;
