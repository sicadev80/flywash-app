import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Facade } from './quickMeasurementStore';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

async function imageToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Impossible de convertir l’image en base64.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function exportPdf(facades: Facade[]) {
  if (!facades.length) {
    throw new Error('Aucune façade à exporter.');
  }

  const facadeBlocks = await Promise.all(
    facades.map(async (facade, index) => {
      const imageSrc = facade.imageUri ? await imageToBase64(facade.imageUri) : '';

      return `
        <div class="card">
          <h2>Façade ${index + 1} — ${facade.name}</h2>
          ${
            imageSrc
              ? `<img src="${imageSrc}" alt="${facade.name}" class="photo" />`
              : '<div class="photo empty">Aucune image</div>'
          }
          <div class="metrics">
            <div><strong>Surface brute :</strong> ${fmt(facade.grossAreaM2)} m²</div>
            <div><strong>Ouvrants :</strong> ${fmt(facade.voidsAreaM2)} m²</div>
            <div><strong>Surface nette :</strong> ${fmt(facade.netAreaM2)} m²</div>
            <div><strong>Mesurée le :</strong> ${new Date(facade.createdAt).toLocaleString('fr-FR')}</div>
          </div>
        </div>
      `;
    })
  );

  const totalNet = facades.reduce((sum, item) => sum + item.netAreaM2, 0);

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 24px;
            color: #1C1C1E;
            background: #F6F3EE;
          }
          h1 {
            margin: 0 0 8px 0;
            font-size: 28px;
          }
          .subtitle {
            margin-bottom: 24px;
            color: #5A5A5E;
          }
          .summary {
            background: #EFE8DB;
            border: 1px solid #E2D7C3;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .card {
            background: white;
            border: 1px solid #E2D7C3;
            border-radius: 18px;
            padding: 16px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .photo {
            width: 100%;
            max-height: 340px;
            object-fit: contain;
            border-radius: 12px;
            background: #F1F1F1;
            margin: 12px 0 16px 0;
          }
          .photo.empty {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 160px;
            color: #777;
          }
          .metrics div {
            margin-bottom: 6px;
            font-size: 15px;
          }
        </style>
      </head>
      <body>
        <h1>Dossier relevé chantier</h1>
        <div class="subtitle">Export généré depuis Flywash</div>

        <div class="summary">
          <div><strong>Nombre de façades :</strong> ${facades.length}</div>
          <div><strong>Surface totale nette :</strong> ${fmt(totalNet)} m²</div>
          <div><strong>Date export :</strong> ${new Date().toLocaleString('fr-FR')}</div>
        </div>

        ${facadeBlocks.join('')}
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({
    html,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exporter le dossier PDF',
      UTI: 'com.adobe.pdf',
    });
  }

  return uri;
}
