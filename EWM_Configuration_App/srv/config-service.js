const cds = require('@sap/cds');
const {AlertNotificationClient,RegionUtils,OAuthAuthentication,Category,Severity,EntityType} = require('@sap_oss/alert-notification-client');

module.exports = cds.service.impl(async function () {
  const { Configurations, AuditLogs } = this.entities;

  // Mapping technical field names to user-friendly labels for Audit Logs
  const FIELD_LABELS = {
    warehouseNumber    : 'Warehouse',
    systemID           : 'System ID',
    messageClass       : 'Message Class',
    messageNumber      : 'Message Number',
    messageDescription : 'Message Description',
    logicType_code     : 'Logic Type',
    actionType_code    : 'Action',
    notificationType   : 'Notification',
    emailAddress       : 'Email',
    rerunMessage       : 'Rerun Message'
  };

  /**
   * Helper to resolve the ANS Region object based on the service URL.
   * Extracts the region key from the URL pattern: cfapps.<region>.hana.ondemand.com
   */
  function resolveRegion(creds) {
    if (creds.region && RegionUtils[creds.region.toUpperCase()]) {
      return RegionUtils[creds.region.toUpperCase()];
    }
    const match = creds.url?.match(/cfapps\.([a-z0-9]+)\.hana\.ondemand\.com/i);
    const regionKey = match?.[1]?.toUpperCase();
    const region = regionKey && RegionUtils[regionKey];
    if (!region) {
      throw new Error(`Cannot resolve ANS region from url "${creds.url}"`);
    }
    return region;
  }

  /**
   * Initializes and returns the Alert Notification Service client
   * using OAuth authentication and detected region.
   */
function getAnsClient() {
    // 1. Extraction directe depuis la structure validée de cds.env
    const creds = cds.env.requires?.['alert-notification']?.credentials;

    if (!creds || !creds.client_id || !creds.client_secret || !creds.url) {
      throw new Error("Impossible to load 'alert-notification' credentials from cds.env.requires.");
    }

    // 2. Gestion de l'URL OAuth
    // Ton instance BTP fournit directement l'URL complète avec le grant_type inclus. On l'utilise brute !
    const oAuthTokenUrl = creds.oauth_url || `${creds.uaa?.url}/oauth/token`;

    // 3. Configuration de l'authentification native SAP
    const auth = new OAuthAuthentication({
      username     : creds.client_id,
      password     : creds.client_secret,
      oAuthTokenUrl: oAuthTokenUrl
    });

    return new AlertNotificationClient({
      authentication: auth,
      region        : resolveRegion(creds)
    });
  }
  // Sanitizes strings for ANS entity names (Action, Subscription, etc.)
  function cleanName(prefix, email) {
    return `${prefix}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  /**
   * Automation: Creates a full monitoring subscription chain in ANS
   * when a Configuration is created or updated.
   */
  this.after(['CREATE', 'UPDATE'], Configurations, async (data) => {
    if (data.IsActiveEntity === false) return;
    if (!data.emailAddress) return;
    
    try {
      const client = getAnsClient();

      const actionName       = cleanName('Action', data.emailAddress);
      const conditionName    = cleanName('Condition', data.emailAddress);
      const severityCondName = cleanName('SeverityCondition', data.emailAddress);
      //const classCondName    = cleanName('ClassCondition', data.emailAddress);
      const numCondName      = cleanName('NumCondition', data.emailAddress);
      const subscriptionName = cleanName('Subscription', data.emailAddress);

      // 1. Create/Update EMAIL Action
      const payloadTemplate = `<html>
      <body style="font-family: Arial; font-size: 12px; color: #222; margin: 20px;">
      <div style="line-height: 1.8; margin-bottom: 20px;">
      -----Original Message-----<br/>
      From: SAP Alert Notification service for SAP BTP &lt;{tags.senderEmail}&gt;<br/>
      <br/>
      Sent: {tags.alertDateTime}<br/>
      <br/>
      Subject: [BTP-EWM Messages Monitoring] Sys: {tags.systemID}, MsgNum: {tags.messageNumber}, Error: {tags.messageDescription}<br/>
      <p>
      [EXTERNAL EMAIL] This email originated from outside of the organization. Do not click links, QR codes or open attachments unless you recognize the sender and know the content is safe.
      </p>
      </div>

      <div style="font-family: Arial; font-size: 12px; color: #222; margin-top: 20px;">
      ------------------------------------------------------------------<br/>
      Warehouse Number &nbsp;&nbsp;&nbsp;&nbsp; : {tags.warehouse}<br/>
      <br/>
      System ID &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : {tags.systemID}<br/>
      <br/>
      Message Class &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : {tags.messageClass}<br/>
      <br/>
      Queue Name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : {tags.queueName}<br/>
      <br/>
      Business Object &nbsp;&nbsp;&nbsp;&nbsp; : {tags.busobject}<br/>
      <br/>
      Business Object Key : {tags.busobjectKey}<br/>
      </div>
      <p style="font-family: Arial; font-size: 12px; color: #222; margin-top: 20px;">
        P.S. {ans-disclaimer}
      </p>
      </body>
      </html>`;

      const subjectTemplate = `[BTP-EWM Messages Monitoring] Sys: {tags.systemID}, MsgNum: {tags.messageNumber}, Error: {tags.messageDescription}`;
      await upsertEntity(client, EntityType.ACTION, actionName, {
        name       : actionName,
        type       : 'EMAIL',
        state      : 'ENABLED',
        description: `Auto-created for warehouse ${data.warehouseNumber}`,
        properties : {
          destination     : data.emailAddress,
          useHtml         : 'true',              
          subjectTemplate : subjectTemplate,     
          payloadTemplate : payloadTemplate 
        }
      });

      // 2. Create/Update Condition (filter by category = ALERT)
      await upsertEntity(client, EntityType.CONDITION, conditionName, {
        name         : conditionName,
        description  : `Matches alerts for ${data.emailAddress}`,
        propertyKey  : 'category',
        predicate    : 'EQUALS',
        propertyValue: Category.ALERT
      });

      // 3. Create/Update Condition (filter by severity = ERROR)
      await upsertEntity(client, EntityType.CONDITION, severityCondName, {
        name         : severityCondName,
        description  : `Minimum severity for ${data.emailAddress}`,
        propertyKey  : 'severity',
        predicate    : 'EQUALS',
        propertyValue: Severity.ERROR
      });

      await upsertEntity(client, EntityType.CONDITION, numCondName, {
        name         : numCondName,
        description  : `Route for Message Number ${data.messageNumber}`,
        propertyKey  : 'tags.messageNumber', 
        predicate    : 'EQUALS',
        propertyValue: String(data.messageNumber)
      });

      // 5. Create/Update Subscription (link conditions to action)
      await upsertEntity(client, EntityType.SUBSCRIPTION, subscriptionName, {
        name      : subscriptionName,
        state     : 'ENABLED',
        actions   : [actionName],
        conditions: [conditionName, severityCondName, numCondName]
      });

      console.log(`[ANS SDK] Setup complete for ${data.emailAddress}.`);

    } catch (err) {
      const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      console.error('[ANS SDK] Failed to set up subscription chain:', detail);
    }
  });

  /**
   * Helper: Performs a create operation, falling back to update if 409 (Conflict) is returned.
   */
  async function upsertEntity(client, type, name, data) {
    try {
      await client.create(type, data);
      console.log(`[ANS SDK] ${type} created: ${name}`);
    } catch (err) {
      const status = err.response?.status || err.statusCode;
      if (status === 409) {
        await client.update(type, data);
        console.log(`[ANS SDK] ${type} already existed, updated: ${name}`);
      } else {
        throw err;
      }
    }
  }

  async function writeAudit(action, entityId, fieldName, oldVal, newVal, user) {
    try {
      let oldValueStr = null, newValueStr = null;
      if (oldVal !== null && oldVal !== undefined) {
        oldValueStr = typeof oldVal === 'object' ? formatObject(oldVal) : formatValue(fieldName, oldVal);
      }
      if (newVal !== null && newVal !== undefined) {
        newValueStr = typeof newVal === 'object' ? formatObject(newVal) : formatValue(fieldName, newVal);
      }
      await INSERT.into(AuditLogs).entries({
        id        : cds.utils.uuid(),
        entityName: 'Configurations',
        entityId  : entityId,
        action    : action,
        fieldName : FIELD_LABELS[fieldName] || fieldName || 'All fields',
        oldValue  : oldValueStr,
        newValue  : newValueStr,
        changedBy : user || 'system',
        changedAt : new Date().toISOString()
      });
    } catch (err) {
      console.error('[Audit] Error :', err.message);
    }
  }

  function formatObject(obj) {
    const lines = [];
    for (const [key, val] of Object.entries(obj)) {
      if (FIELD_LABELS[key] && val !== null && val !== undefined) {
        lines.push(`${FIELD_LABELS[key]}: ${formatValue(key, val)}`);
      }
    }
    return lines.length > 0 ? lines.join(' | ') : null;
  }

  function formatValue(field, val) {
    if (['rerunMessage'].includes(field)) return val ? 'Yes' : 'No';
    if (!val) return '(empty)';
    return String(val);
  }

  // --- Lifecycle Handlers ---

  this.before('SAVE', Configurations, async (req) => {
    const draft = await SELECT.one.from(Configurations.drafts).where({ ID: req.data.ID });
    if (!draft) return;
    if (!draft.warehouseNumber?.trim()) req.error(400, 'Warehouse is required', 'in/warehouseNumber');
    if (!draft.messageNumber?.trim()) req.error(400, 'Message Number is required', 'in/messageNumber');
    if (!draft.messageDescription?.trim()) req.error(400, 'Message Description is required', 'in/messageDescription');
  });

  this.after('NEW', Configurations.drafts, async (data, req) => {
    await writeAudit('CREATE', data.ID, null, null, data, req.user?.id);
  });

  this.after('PATCH', Configurations.drafts, async (data, req) => {
    for (const field of Object.keys(FIELD_LABELS)) {
      const value = req.data[field] ?? req.data[field.replace('_code', '')];
      if (value !== undefined) {
        await writeAudit('UPDATE', data.ID, field, null, value, req.user?.id);
      }
    }
  });

  // --- Deletion Handling ---
  this.before('DELETE', Configurations, async (req) => {
    const old = await SELECT.one.from(Configurations).where({ ID: req.data.ID });
    if (old) req._deletedConfig = old;
  });

  this.after('DELETE', Configurations, async (data, req) => {
    if (req._deletedConfig) {
      await writeAudit('DELETE', req.data.ID, null, req._deletedConfig, null, req.user?.id);
    }
  });

  this.before('DELETE', Configurations.drafts, async (req) => {
    const old = await SELECT.one.from(Configurations.drafts).where({ ID: req.data.ID });
    if (old) req._deletedDraft = old;
  });

  this.after('DELETE', Configurations.drafts, async (data, req) => {
    if (req._deletedDraft) {
      await writeAudit('DELETE', req.data.ID, null, req._deletedDraft, null, req.user?.id);
    }
  });
});