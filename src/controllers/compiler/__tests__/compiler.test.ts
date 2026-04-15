import { describe, it, expect, vi, beforeEach } from 'vitest';
import run_client_sql_code from '../index.js';
import { Request, Response } from 'express';
import * as services from '../../../services/index.js';

vi.mock('../../../services/index.js', () => ({
  getAssignmentByIdCached: vi.fn(),
  getAssignmentSolutionByAssignmentIdCached: vi.fn(),
  TaskQueueClient: {
    enqueue: vi.fn(),
  },
}));

describe('Compiler Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    };
    vi.clearAllMocks();
  });

  it('should return 202 and taskId on successful job submission', async () => {
    req = {
      body: {
        assignmentId: '507f1f77bcf86cd799439011',
        userSql: 'SELECT * FROM users',
      },
    };
    const mockAssignment = { id: '507f1f77bcf86cd799439011', name: 'Test Assignment', mode: 'read', pgSchemaReady: true };
    (services.getAssignmentByIdCached as any).mockResolvedValue(mockAssignment);
    (services.getAssignmentSolutionByAssignmentIdCached as any).mockResolvedValue({ solutionSql: 'SELECT 1', validationSql: null });
    (services.TaskQueueClient.enqueue as any).mockResolvedValue('task-123');

    await run_client_sql_code(req as Request, res as Response);

    expect(services.getAssignmentByIdCached).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(services.TaskQueueClient.enqueue).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(202);
    expect(jsonMock).toHaveBeenCalledWith({ taskId: 'task-123' });
  });

  it('should use mode from assignment in enqueued job', async () => {
    req = {
      body: {
        assignmentId: '507f1f77bcf86cd799439011',
        userSql: 'SELECT * FROM users',
      },
    };
    const mockAssignment = { id: '507f1f77bcf86cd799439011', mode: 'write', pgSchemaReady: true };
    (services.getAssignmentByIdCached as any).mockResolvedValue(mockAssignment);
    (services.getAssignmentSolutionByAssignmentIdCached as any).mockResolvedValue(null);
    (services.TaskQueueClient.enqueue as any).mockResolvedValue('task-456');

    await run_client_sql_code(req as Request, res as Response);

    expect(services.TaskQueueClient.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'write' }),
    );
  });

  it('should return 404 if the assignment is missing', async () => {
    req = {
      body: {
        assignmentId: '507f1f77bcf86cd799439011',
        userSql: 'SELECT * FROM users',
      },
    };
    (services.getAssignmentByIdCached as any).mockResolvedValue(null);

    await run_client_sql_code(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Couldn't find the assignment!" });
  });

  it('should return 503 if assignment schema is not ready', async () => {
    req = {
      body: {
        assignmentId: '507f1f77bcf86cd799439011',
        userSql: 'SELECT * FROM users',
      },
    };
    const mockAssignment = { id: '507f1f77bcf86cd799439011', mode: 'read', pgSchemaReady: false };
    (services.getAssignmentByIdCached as any).mockResolvedValue(mockAssignment);

    await run_client_sql_code(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(503);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Assignment unavailable at the moment!' });
  });

  it('should return 400 on invalid input (Zod)', async () => {
    req = {
      body: {
        assignmentId: 'invalid-id',
        userSql: 'SELECT * FROM users',
      },
    };

    await run_client_sql_code(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
  });
});
