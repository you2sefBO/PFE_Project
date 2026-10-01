const { AlertNotificationClient, RegionUtils, OAuthAuthentication, EntityType } = require('@sap_oss/alert-notification-client');
const cds   = require('@sap/cds');
const axios = require('axios');

module.exports = cds.service.impl(async function () {

  // ─────────────────────────────────────────────────────────────────
  // HELPER: Initialize ANS client using SDK with RegionUtils.EU10
  // ─────────────────────────────────────────────────────────────────
  function getAnsClient() {
    const vcap     = JSON.parse(process.env.VCAP_SERVICES || '{}');
    const ansCreds = vcap['alert-notification']?.[0]?.credentials;
    if (!ansCreds) throw new Error('ANS credentials not found in VCAP_SERVICES');

    const oAuthTokenUrl = ansCreds.oauth_url.split('?')[0];

    const auth = new OAuthAuthentication({
      username     : ansCreds.client_id,
      password     : ansCreds.client_secret,
      oAuthTokenUrl: oAuthTokenUrl
    });

    return new AlertNotificationClient({
      authentication: auth,
      region        : RegionUtils.EU10
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPER: Get OAuth2 token for direct ANS producer API calls
  // ─────────────────────────────────────────────────────────────────
  async function getAnsToken() {
    const vcap     = JSON.parse(process.env.VCAP_SERVICES || '{}');
    const ansCreds = vcap['alert-notification']?.[0]?.credentials;
    if (!ansCreds) throw new Error('ANS credentials not found in VCAP_SERVICES');

    const tokenUrl = ansCreds.oauth_url.split('?')[0];
    const response = await axios.post(
      tokenUrl,
      'grant_type=client_credentials',
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        auth   : { username: ansCreds.client_id, password: ansCreds.client_secret }
      }
    );
    return { token: response.data.access_token, url: ansCreds.url };
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPER: Resolve recipient email from ANS using SDK
  // Finds the action linked to the subscription that matches
  // the given messageNumber condition
  // ─────────────────────────────────────────────────────────────────
  async function resolveEmailFromAns(messageNumber) {
    try {
      const client = getAnsClient();
      const condResult    = await client.getAll(EntityType.CONDITION);
      const conditions    = condResult?.results || condResult?.items || condResult || [];
      const subResult     = await client.getAll(EntityType.SUBSCRIPTION);
      const subscriptions = subResult?.results || subResult?.items || subResult || [];
      const actResult     = await client.getAll(EntityType.ACTION);
      const actions       = actResult?.results || actResult?.items || actResult || [];

      console.log(`[ANS] Found ${conditions.length} conditions, ${subscriptions.length} subscriptions, ${actions.length} actions`);

      const matchingConditions = conditions.filter(c => c.propertyValue === messageNumber);
      if (matchingConditions.length === 0) {
        console.warn(`[ANS] No condition for messageNumber: ${messageNumber}`);
        return null;
      }
      const conditionNames = matchingConditions.map(c => c.name);

      // 2. Find all subscription
      const matchingSubs = subscriptions.filter(s => 
        s.conditions?.some(condName => conditionNames.includes(condName))
      );
      if (matchingSubs.length === 0) {
        console.warn(`[ANS] No subscription for conditions: ${conditionNames.join(', ')}`);
        return null;
      }

      // 3. Collect all conditions from all subscriptions
      const allActionNames = matchingSubs.flatMap(s => s.actions || []);

      // 4. Match all conditions to their corresponding mail adress
      const emails = allActionNames
        .map(actName => actions.find(a => a.name === actName))
        .filter(action => action && action.properties && action.properties.destination)
        .map(action => action.properties.destination);

      // 5. Collect all mails in one ligne
      const uniqueEmails = [...new Set(emails)];

      console.log(`[ANS] Resolved emails for msgNo ${messageNumber}: ${uniqueEmails.join(', ')}`);
    
      return uniqueEmails.length > 0 ? uniqueEmails.join(', ') : null;

    } catch (err) {
      console.error('[ANS] resolveEmailFromAns failed:', err.message);
      return null;
    }
  }
  // ─────────────────────────────────────────────────────────────────
  // HELPER: Send alert event to ANS producer API
  // ─────────────────────────────────────────────────────────────────
  async function sendAnsAlert(data) {
    const { token, url } = await getAnsToken();

    const ansEvent = {
      eventType : 'EWM_QUEUE_ALERT',
      severity  : 'ERROR',
      category  : 'ALERT',
      subject: `[BTP-EWM Messages Monitoring] Sys: ${data.systemID}, MsgNum: ${data.messageNumber}, Error: ${data.messageDescription || ''}`,
      body      : `EWM Alert — Warehouse: ${data.warehouseNumber} | Queue: ${data.queueName} | Msg: ${data.messageNumber}`, 
      resource  : {
        resourceName: data.warehouseNumber,
        resourceType: 'EWM_Warehouse'
      },
      tags: {
        warehouse          : data.warehouseNumber    || 'N/A',
        systemID           : data.systemID           || 'N/A',
        messageClass       : data.messageClass       || 'N/A',
        messageNumber      : data.messageNumber      || 'N/A',
        messageDescription : data.messageDescription || 'N/A',  
        busobject          : data.busobject          || 'N/A',
        busobjectKey       : data.busobjectKey       || 'N/A',
        queueName          : data.queueName          || 'N/A',  
        alertDateTime      : new Date().toLocaleString('en-GB', { timeZone: 'Europe/Paris' }),
        senderEmail        : 'btp.alerting@notifications.sap.com'
      }
    };

    const response = await axios.post(
      `${url}/cf/producer/v1/resource-events`,
      ansEvent,
      {
        headers: {
          'Content-Type' : 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    console.log(`[ANS] Event sent — HTTP: ${response.status}`);
    return response.status;
  }

// ─────────────────────────────────────────────────────────────────
// HELPER: Check if an identical alert was already sent recently
// Avoids duplicate alerts for the same queue error within 24 hours
// ─────────────────────────────────────────────────────────────────
  async function isAlreadyAlerted(data) {
    try {
      const since = new Date(Date.now() - 3* 60 * 1000).toISOString();
      const existing = await SELECT.one
      .from('ewm.monitoring.EwmAlertLog')
      .where({
        warehouseNumber       : data.warehouseNumber,
        systemID              : data.systemID,
        messageNumber         : data.messageNumber,
        messageDescription    : data.messageDescription,
        sendStatus      : 'SUCCESS'
      })
      .and(`alertedAt > '${since}'`);

      if (existing) {
        console.log(`Alert already sent for ${data.warehouseNumber}/${data.messageDescription}/${data.messageNumber} — skipping`);
        return true;
      }
      return false;

    } catch (err) {
      console.error('Check failed:', err.message);
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // CORE: Central alert processing function
  // 1. Resolve recipient email from ANS
  // 2. Send alert event to ANS
  // 3. Save result in EwmAlertLog
  // ─────────────────────────────────────────────────────────────────
  async function processAlert(data) {
    let sendStatus = 'SUCCESS';
    let sendError  = null;

    // Check for duplicate alert
    const duplicate = await isAlreadyAlerted(data);
    if (duplicate) return 'DUPLICATE';
    const emailSentTo = await resolveEmailFromAns(data.messageNumber);

    try {
      await sendAnsAlert({ ...data, recipientEmail: emailSentTo || '' });
    } catch (err) {
      const detail = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;
      console.error('[ANS] Failed to send alert:', detail);
      sendStatus = 'FAILED';
      sendError  = detail?.substring(0, 500);
    }

    try {
      await INSERT.into('ewm.monitoring.EwmAlertLog').entries({
        ID                 : cds.utils.uuid(),
        warehouseNumber    : data.warehouseNumber,
        systemID           : data.systemID,
        messageClass       : data.messageClass,
        messageNumber      : data.messageNumber,
        messageDescription : data.messageDescription,
        queueName          : data.queueName,
        busobject          : data.busobject,
        busobjectKey       : data.busobjectKey,
        emailSentTo        : emailSentTo || 'unknown',
        alertedAt          : new Date().toISOString(),
        sendStatus         : sendStatus,
        sendError          : sendError
      });
      console.log(`Saved — emailSentTo: ${emailSentTo} | status: ${sendStatus}`);
    } catch (err) {
      console.error('Save failed:', err.message);
    }
    return sendStatus;
  }

  // ─────────────────────────────────────────────────────────────────
  // ACTION: receiveAlert — called by server.js webhook and for testing
  // ─────────────────────────────────────────────────────────────────
  this.on('receiveAlert', async (req) => {
    const {
        warehouseNumber, systemID, messageClass, messageNumber,
        messageDescription, queueName, busobject, busobjectKey
    } = req.data;
    console.log(`Processing alert for WH: ${warehouseNumber} | Queue: ${queueName}`);

    return await processAlert({
        warehouseNumber,
        systemID,
        messageClass,
        messageNumber,
        messageDescription,
        queueName,
        busobject,
        busobjectKey
    });
  });
});