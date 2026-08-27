import { createWorker } from 'tesseract.js';

// Protocole worker OCR : image (File/Blob) → texte brut (ou erreur).
export interface OcrRequest {
  image: File | Blob;
}

export type OcrResponse = { ok: true; text: string } | { ok: false; error: string };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<OcrRequest>) => void) | null;
  postMessage: (message: OcrResponse) => void;
};

// Tesseract.js tourne ici, dans un Web Worker dédié, pour ne pas bloquer le thread
// principal pendant l'OCR (WASM potentiellement lent).
scope.onmessage = async (event: MessageEvent<OcrRequest>) => {
  try {
    const worker = await createWorker('eng');
    try {
      const { data } = await worker.recognize(event.data.image);
      scope.postMessage({ ok: true, text: data.text });
    } finally {
      await worker.terminate();
    }
  } catch (err) {
    scope.postMessage({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
