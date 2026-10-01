using { ewm.monitoring as db } from '../db/schema';

/**
 * Service exposed at the endpoint '/config'.
 * Accepts both human users (XSUAA roles) and M2M clients (ABAP via uaa.resource).
 */
@path: '/config'
service ConfigService {

  /**
   * Main configuration entity.
   * ADMIN / OPERATOR : full access (create, read, update, delete)
   * VIEWER           : read-only access for human users
   * system-user      : read-only access for M2M clients (ABAP ERP via client_credentials)
   */
  @odata.draft.enabled
  @restrict: [
    { grant: '*',    to: ['ADMIN']                    },
    { grant: '*',    to: ['OPERATOR']                 },
    { grant: 'READ', to: ['VIEWER']                   },
    { grant: 'READ', to: ['system-user']              }
  ]
  entity Configurations as projection on db.Configurations;

  /**
   * Read-only entity providing technical lookup codes for Logical operators.
   * Accessible by any authenticated user or M2M client.
   */
  @readonly
  entity LogicTypes as projection on db.LogicTypes;

  /**
   * Read-only entity providing technical lookup codes for Action types.
   * Accessible by any authenticated user or M2M client.
   */
  @readonly
  entity ActionTypes as projection on db.ActionTypes;

  /**
   * Read-only transaction log used for auditing purposes.
   * Strict security: only ADMIN role can access audit logs.
   */
  //@readonly
  @restrict: [
    { grant: '*', to: ['ADMIN'] }
  ]
  entity AuditLogs as projection on db.AuditLogs order by changedAt desc;
}
