import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { ProjectItem, BuildingItem } from './projectStore';
import type { CompanyProfile } from './companyStore';
import { LEGAL_STATUS_LABELS } from './companyStore';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');
const money = (v: number) => `${fmt(v)} €`;

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('fr-FR');
}

function buildingSurfaceM2(building: BuildingItem): number {
  const facadesM2 = building.facades.reduce((sum, f) => sum + f.netAreaM2, 0);
  const roofsM2 = building.roofs.reduce((sum, r) => sum + r.areaM2, 0);
  return facadesM2 + roofsM2;
}

export async function generateDevisPdf(
  project: ProjectItem,
  company: CompanyProfile
): Promise<string> {
  const isVatApplicable = company.vatStatus === 'assujetti';
  const vatRate = isVatApplicable ? project.vatRate ?? company.defaultVatRate : 0;
  const totalHT = project.quoteAmount || 0;
  const totalTVA = totalHT * (vatRate / 100);
  const totalTTC = totalHT + totalTVA;

  const devisNumber = project.devisNumber || '—';
  const devisDate = project.devisDate ? new Date(project.devisDate) : new Date();
  const devisDateStr = devisDate.toLocaleDateString('fr-FR');
  const validUntilStr = addDays(devisDate.toISOString(), company.devisValidityDays);

  const legalStatusLabel =
    company.legalStatus === 'autre' && company.legalStatusOther
      ? company.legalStatusOther
      : LEGAL_STATUS_LABELS[company.legalStatus];

  // Taux €/m² et h/m² figés au moment du chiffrage. Pour un projet chiffré
  // avant l'ajout de ce détail, on retombe sur une moyenne calculée à partir
  // du total, pour ne rien casser sur les anciens devis.
  const totalProjectSurface = project.buildings.reduce(
    (sum, b) => sum + buildingSurfaceM2(b),
    0
  );
  const pricePerM2 =
    project.pricePerM2Ht ?? (totalProjectSurface > 0 ? totalHT / totalProjectSurface : 0);
  const hoursPerM2 = project.hoursPerM2 ?? 0;
  const showTime = hoursPerM2 > 0;

  const facadeProductLabel = project.facadeProductsSummary?.productLabel || '—';
  const roofProductLabel = project.roofProductsSummary?.productLabel || '—';

  const buildingBlocks = project.buildings
    .map((building) => {
      const surface = buildingSurfaceM2(building);
      const buildingTotalHT = surface * pricePerM2;
      const buildingHours = surface * hoursPerM2;

      const rows = [
        ...building.facades.map((facade) => {
          const lineHours = facade.netAreaM2 * hoursPerM2;
          return `
            <tr>
              <td>Façade — ${facade.name}</td>
              <td class="num">${fmt(facade.netAreaM2)} m²</td>
              <td>${facadeProductLabel}</td>
              ${showTime ? `<td class="num">≈ ${fmt(lineHours)} h</td>` : ''}
            </tr>`;
        }),
        ...building.roofs.map((roof) => {
          const lineHours = roof.areaM2 * hoursPerM2;
          return `
            <tr>
              <td>Toiture — ${roof.name}</td>
              <td class="num">${fmt(roof.areaM2)} m²</td>
              <td>${roofProductLabel}</td>
              ${showTime ? `<td class="num">≈ ${fmt(lineHours)} h</td>` : ''}
            </tr>`;
        }),
      ].join('');

      return `
        <div class="buildingBlock">
          <div class="buildingHeader">
            <span>${building.name}</span>
            <span>${money(buildingTotalHT)} HT${showTime ? ` · ≈ ${fmt(buildingHours)} h` : ''}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Élément</th>
                <th class="num">Surface</th>
                <th>Produit</th>
                ${showTime ? '<th class="num">Temps estimé</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>`;
    })
    .join('');

  const vatMention = isVatApplicable
    ? `<div class="totalRow"><span>TVA (${fmt(vatRate)} %)</span><span>${money(totalTVA)}</span></div>`
    : `<div class="vatExempt">TVA non applicable, art. 293 B du CGI</div>`;

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 28px;
            color: #1C1C1E;
            font-size: 13px;
          }
          .headerRow {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 28px;
          }
          .company h1 {
            margin: 0 0 4px 0;
            font-size: 22px;
            color: #C79A2B;
          }
          .company div { color: #444; line-height: 1.5; }
          .docTitle { text-align: right; }
          .docTitle h2 { margin: 0; font-size: 20px; }
          .docTitle div { color: #555; margin-top: 4px; }
          .clientBox {
            background: #F7F5F0;
            border: 1px solid #E9E4D8;
            border-radius: 12px;
            padding: 14px 18px;
            margin-bottom: 24px;
            width: 260px;
          }
          .clientBox h3 { margin: 0 0 6px 0; font-size: 13px; color: #8A7A4A; text-transform: uppercase; }
          .buildingBlock {
            border: 1px solid #E9E4D8;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 16px;
            page-break-inside: avoid;
          }
          .buildingHeader {
            display: flex;
            justify-content: space-between;
            background: #F7F5F0;
            padding: 10px 14px;
            font-weight: 800;
            font-size: 13.5px;
            color: #3A3A3E;
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #ECECEF; font-size: 12.5px; }
          th { background: #FFFFFF; font-size: 11px; text-transform: uppercase; color: #8A7A4A; border-bottom: 1px solid #E9E4D8; }
          td.num, th.num { text-align: right; white-space: nowrap; }
          tbody tr:last-child td { border-bottom: none; }
          .totalsBox {
            margin-left: auto;
            margin-top: 20px;
            width: 280px;
            border: 1px solid #E9E4D8;
            border-radius: 12px;
            padding: 14px 18px;
            margin-bottom: 28px;
          }
          .totalRow { display: flex; justify-content: space-between; padding: 4px 0; }
          .totalRow.grand { font-weight: 800; font-size: 16px; border-top: 1px solid #E2D7C3; margin-top: 6px; padding-top: 10px; }
          .vatExempt { font-size: 11px; color: #777; margin: 6px 0; }
          .legal { font-size: 10.5px; color: #666; line-height: 1.6; margin-top: 30px; border-top: 1px solid #ECECEF; padding-top: 14px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
          .signatures div { width: 45%; }
          .signatures .box { border: 1px solid #ddd; border-radius: 10px; height: 90px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="headerRow">
          <div class="company">
            <h1>${company.companyName || 'Mon entreprise'}</h1>
            <div>${legalStatusLabel}</div>
            <div>${company.address}</div>
            <div>${[company.postalCode, company.city].filter(Boolean).join(' ')}</div>
            <div>${company.phone}</div>
            <div>${company.email}</div>
            <div>SIRET : ${company.siret || '—'}</div>
            ${company.rcs ? `<div>${company.rcs}</div>` : ''}
            ${isVatApplicable && company.vatNumber ? `<div>TVA : ${company.vatNumber}</div>` : ''}
          </div>
          <div class="docTitle">
            <h2>DEVIS N° ${devisNumber}</h2>
            <div>Date : ${devisDateStr}</div>
            <div>Valable jusqu'au ${validUntilStr}</div>
          </div>
        </div>

        <div class="clientBox">
          <h3>Client</h3>
          <div><strong>${project.clientName}</strong></div>
          <div>${project.address}</div>
          <div>${[project.postalCode, project.city].filter(Boolean).join(' ')}</div>
          <div>${project.phone || ''}</div>
        </div>

        ${buildingBlocks}

        <div class="totalsBox">
          <div class="totalRow"><span>Total HT</span><span>${money(totalHT)}</span></div>
          ${vatMention}
          <div class="totalRow grand"><span>Total TTC</span><span>${money(totalTTC)}</span></div>
        </div>

        <div class="legal">
          Devis valable ${company.devisValidityDays} jours à compter de sa date d'émission.
          ${showTime ? "Les temps indiqués sont des estimations réparties au prorata des surfaces et peuvent varier selon les conditions de chantier." : ''}
          En cas de retard de paiement, une pénalité au taux de 3 fois le taux d'intérêt légal sera appliquée,
          ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 €
          (art. L441-10 et D441-5 du code de commerce).
        </div>

        <div class="signatures">
          <div>
            <div>Le prestataire</div>
            <div class="box"></div>
          </div>
          <div>
            <div>Le client — « Bon pour accord »</div>
            <div class="box"></div>
          </div>
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exporter le devis',
      UTI: 'com.adobe.pdf',
    });
  }

  return uri;
}
