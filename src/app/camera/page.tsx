// Camera Page
// Renders the CameraFeed component for capturing photobooth images.

import CameraFeed from "@/components/CameraFeed";
import Script from "next/script";

export default function CameraPage() {
  // Optionally load external scripts (e.g., glfx for effects)
  <Script src="https://unpkg.com/glfx@0.0.8/glfx.min.js"/>
  // Render the camera feed UI
  return <CameraFeed />;
}

