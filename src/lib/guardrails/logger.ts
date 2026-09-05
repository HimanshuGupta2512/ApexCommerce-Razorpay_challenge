import { db } from '../db';

interface AuditEventParams {
  action: string;
  status: 'APPROVED' | 'REJECTED';
  payload: any;
  reason?: string;
  metadata?: any;
}

export async function logAuditEvent({ action, status, payload, reason, metadata }: AuditEventParams) {
  const log = await db.auditLog.create({
    data: {
      event: action,
      gatekeeperPass: status === 'APPROVED',
      gatekeeperLogs: reason || null,
      agentContext: metadata ? JSON.stringify(metadata) : null,
      details: payload ? JSON.stringify(payload) : null,
    }
  });
  return log.id;
}
