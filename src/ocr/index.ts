import OcrWorker from './ocr.worker?worker';
import type { OcrResponse } from './ocr.worker';
import { parseReport } from './parseReport';
import type { EspionageReport } from './parseReport';

export type { EspionageReport } from './parseReport';

// Contrat `ocrEspionageReport(image: File): Promise<EspionageData>`.
// Renvoie en réalité un `EspionageReport` (surensemble d'`EspionageData`) pour exposer à
// l'écran de revue les lignes non reconnues et les doublons — sans re-lancer l'OCR.
export function ocrEspionageReport(image: File): Promise<EspionageReport> {
  return new Promise((resolve, reject) => {
    const worker = new OcrWorker();

    worker.onmessage = (event: MessageEvent<OcrResponse>) => {
      worker.terminate();
      const message = event.data;
      if (!message.ok) {
        reject(new Error(message.error));
        return;
      }
      resolve(parseReport(message.text));
    };

    worker.onerror = () => {
      worker.terminate();
      reject(new Error('OCR worker failed'));
    };

    worker.postMessage({ image });
  });
}
