import { pdfjs } from "react-pdf";

// Ensure PDF worker is available locally
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export const PDF_CONFIG = {
  workerSrc: pdfjs.GlobalWorkerOptions.workerSrc,
};
