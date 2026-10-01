const cds = require('@sap/cds');

const alertBatches = new Map();

cds.on('bootstrap', app => {

  app.use(require('express').json({ limit: '50mb' }));

  app.post('/api/receiveAlert', async (req, res) => {
    console.log('>>> Webhook successfully reached! <<<');
    console.log('Raw req.body:', JSON.stringify(req.body));

    let alertService;
    try {
      alertService = await cds.connect.to('EwmAlertService');
    } catch (err) {
      console.error('EwmAlertService not available:', err);
      return res.status(500).send('Service not available');
    }

    // ── Support tableau ET objet simple ──────────────────────────────
    const rawBody  = req.body?.data || req.body?.CONTENT || req.body;
    const payloads = Array.isArray(rawBody) ? rawBody : [rawBody];

    try {
      for (const payload of payloads) {

        const msgNumber = payload.MSG_NO
          ? String(payload.MSG_NO).padStart(3, '0')
          : null;

        const batchKey = `${payload.WAREHOUSE}_${payload.SYSTEMID || 'UNKNOWN'}_${payload.QUEUE_NAME}_${payload.MSG_CLASS}_${msgNumber}`;

        if (!alertBatches.has(batchKey)) {

          alertBatches.set(batchKey, {
            warehouseNumber   : payload.WAREHOUSE,
            systemID          : payload.SYSTEMID,
            messageClass      : payload.MSG_CLASS,
            messageNumber     : msgNumber,
            messageDescription: payload.MSG_DESC || payload.ERROR_TEXT || 'N/A', 
            queueName         : payload.QUEUE_NAME,
            busobject         : payload.BUSOBJ,
            recipientEmail    : payload.RECIPIENT_EMAIL || '',
            affectedKeys      : payload.BUSOBJ_KEY ? [String(payload.BUSOBJ_KEY)] : [],

            timer: setTimeout(async () => {
              const batch = alertBatches.get(batchKey);
              if (!batch) return;

              alertBatches.delete(batchKey);

              const uniqueKeys    = [...new Set(batch.affectedKeys)];
              const aggregatedKeys = uniqueKeys.join(', ');

              try {
                const activeService = await cds.connect.to('EwmAlertService');
                
                await activeService.send('receiveAlert', {
                  warehouseNumber   : batch.warehouseNumber,
                  systemID          : batch.systemID,
                  messageClass      : batch.messageClass,
                  messageNumber     : batch.messageNumber,
                  messageDescription: batch.messageDescription,
                  queueName         : batch.queueName,
                  busobject         : batch.busobject,
                  busobjectKey      : aggregatedKeys
                });

                console.log(`[ANS] Aggregated alert successfully processed by CAP`);
              } catch (err) {
                console.error('Error during deferred alert processing:', err.message);
              }
            }, 5000)
          });

          console.log(`[Batcher] Started new 5s aggregation window for key: ${batchKey}`);

        } else {
          const currentBatch = alertBatches.get(batchKey);
          if (payload.BUSOBJ_KEY) {
            currentBatch.affectedKeys.push(String(payload.BUSOBJ_KEY));
            console.log(`[Batcher] Appended key ${payload.BUSOBJ_KEY} to active batch (Count: ${currentBatch.affectedKeys.length})`);
          }
        }
      }

      return res.status(202).send('Event received and accepted for aggregation');

    } catch (err) {
      console.error('Error during alert ingestion:', err.message);
      return res.status(202).send('Event received but failed during initial batch mapping');
    }
  });
});

module.exports = cds.server;