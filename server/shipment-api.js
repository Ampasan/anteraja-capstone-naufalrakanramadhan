const history = [];

function validate({ trackingNumber, weight, distance }) {
  const errors = [];
  const tn = String(trackingNumber ?? '').trim();

  if (!tn) {
    errors.push({ field: 'trackingNumber', message: 'Tracking number wajib diisi.' });
  }

  const weightRaw = String(weight ?? '').trim();
  const weightNum = Number(weightRaw);
  if (!weightRaw) {
    errors.push({ field: 'weight', message: 'Weight wajib diisi.' });
  } else if (Number.isNaN(weightNum)) {
    errors.push({ field: 'weight', message: 'Weight harus berupa angka.' });
  } else if (weightNum <= 0) {
    errors.push({ field: 'weight', message: 'Weight harus lebih besar dari 0.' });
  }

  const distanceRaw = String(distance ?? '').trim();
  const distanceNum = Number(distanceRaw);
  if (!distanceRaw) {
    errors.push({ field: 'distance', message: 'Distance wajib diisi.' });
  } else if (Number.isNaN(distanceNum)) {
    errors.push({ field: 'distance', message: 'Distance harus berupa angka.' });
  } else if (distanceNum <= 0) {
    errors.push({ field: 'distance', message: 'Distance harus lebih besar dari 0.' });
  }

  return { errors, tn, weightNum, distanceNum };
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

// Middleware Vite: simulasi backend shipment supaya workflow form -> request -> history
// benar-benar melewati jaringan, bukan sekadar state React di sisi klien.
export function shipmentApiPlugin() {
  return {
    name: 'shipment-api',
    configureServer(server) {
      server.middlewares.use('/api/shipments', (req, res) => {
        if (req.method === 'GET') {
          sendJson(res, 200, { history });
          return;
        }

        // Dipakai regression test untuk memulai tiap run dari state bersih.
        if (req.method === 'DELETE') {
          history.length = 0;
          sendJson(res, 200, { status: 'RESET', history });
          return;
        }

        if (req.method !== 'POST') {
          sendJson(res, 405, { status: 'METHOD_NOT_ALLOWED' });
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          let payload;
          try {
            payload = JSON.parse(body);
          } catch {
            sendJson(res, 400, {
              status: 'VALIDATION_ERROR',
              errors: [{ field: 'body', message: 'Body request bukan JSON yang valid.' }],
            });
            return;
          }

          const { errors, tn, weightNum, distanceNum } = validate(payload);
          if (errors.length > 0) {
            sendJson(res, 400, { status: 'VALIDATION_ERROR', errors });
            return;
          }

          const shipment = {
            trackingNumber: tn,
            weight: weightNum,
            distance: distanceNum,
            requestedAt: new Date().toISOString(),
          };
          history.unshift(shipment);
          sendJson(res, 201, { status: 'SUCCESS', shipment });
        });
      });
    },
  };
}
