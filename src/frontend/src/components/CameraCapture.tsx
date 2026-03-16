import { useCamera } from "@/camera/useCamera";
import { Button } from "@/components/ui/button";
import { AlertCircle, Camera, Loader2, RotateCcw } from "lucide-react";
import { useEffect } from "react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export default function CameraCapture({
  onCapture,
  onCancel,
}: CameraCaptureProps) {
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: "user", quality: 0.85, format: "image/jpeg" });

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      stopCamera();
      onCapture(file);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  if (isSupported === false) {
    return (
      <div
        className="flex flex-col items-center gap-4 p-6 text-center"
        data-ocid="camera.error_state"
      >
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-foreground font-display font-600">
          Camera Not Supported
        </p>
        <p className="text-muted-foreground text-sm">
          Your browser or device does not support camera access.
        </p>
        <Button
          variant="outline"
          onClick={handleCancel}
          data-ocid="camera.cancel_button"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Video preview */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] w-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ minHeight: 240 }}
        />
        {isLoading && !isActive && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/60"
            data-ocid="camera.loading_state"
          >
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        {error && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3"
            data-ocid="camera.error_state"
          >
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-white text-sm text-center px-4">
              {error.message}
            </p>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <Button
          data-ocid="camera.button"
          variant="outline"
          onClick={() => startCamera()}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Retry Camera
        </Button>
      )}

      <div className="flex gap-3">
        <Button
          data-ocid="camera.cancel_button"
          variant="outline"
          onClick={handleCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          data-ocid="camera.primary_button"
          onClick={handleCapture}
          disabled={isLoading || !isActive}
          className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Camera className="w-4 h-4" />
          Take Photo
        </Button>
      </div>
    </div>
  );
}
