import { renderToStaticMarkup } from 'react-dom/server'
import QRCode from 'react-qr-code'

export function printVehicleQr(vehicle) {
  if (!vehicle?.qr_code) return

  const qrMarkup = renderToStaticMarkup(<QRCode value={vehicle.qr_code} size={240} />)
  const printWindow = window.open('', '_blank', 'width=900,height=900')

  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>Vehicle QR - ${vehicle.plate_number || ''}</title>
        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            color: #0f172a;
          }
          .sheet {
            width: 420px;
            padding: 32px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
          }
          .title { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
          .meta { font-size: 14px; color: #475569; margin-bottom: 18px; }
          .qr { display: inline-flex; padding: 18px; border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; }
          .code { margin-top: 18px; font-size: 12px; letter-spacing: 0.12em; color: #334155; }
          .footer { margin-top: 18px; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="title">DISTRAC Vehicle QR</div>
          <div class="meta">${vehicle.plate_number || 'Unknown Plate'}${vehicle.depot?.depot_name ? ` • ${vehicle.depot.depot_name}` : ''}</div>
          <div class="qr">${qrMarkup}</div>
          <div class="code">${vehicle.qr_code}</div>
          <div class="footer">Scan this code to pointage the vehicle at the start of the day.</div>
        </div>
        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function () { window.close(); };
          };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
