import { describe, it, expect, beforeEach } from 'vitest';
import { useCollaborationStore } from './collaborationStore';

describe('useCollaborationStore', () => {
  beforeEach(() => {
    useCollaborationStore.getState().reset();
  });

  it('has correct initial state', () => {
    const s = useCollaborationStore.getState();
    expect(s.onlineUsers).toEqual([]);
    expect(s.currentDocumentId).toBeNull();
    expect(s.lockInfo).toBeNull();
    expect(s.isConnected).toBe(false);
    expect(s.lockedDocuments.size).toBe(0);
  });

  it('setOnlineUsers replaces the list', () => {
    const users = [{ user_id: 1, full_name: 'Alice', email: 'a@example.com' }];
    useCollaborationStore.getState().setOnlineUsers(users);
    expect(useCollaborationStore.getState().onlineUsers).toEqual(users);
  });

  it('addOnlineUser appends new user', () => {
    const { addOnlineUser } = useCollaborationStore.getState();
    addOnlineUser({ user_id: 1, full_name: 'Alice', email: 'a@example.com' });
    addOnlineUser({ user_id: 2, full_name: 'Bob', email: 'b@example.com' });
    expect(useCollaborationStore.getState().onlineUsers).toHaveLength(2);
  });

  it('addOnlineUser updates existing user', () => {
    const { addOnlineUser } = useCollaborationStore.getState();
    addOnlineUser({ user_id: 1, full_name: 'Alice', email: 'a@example.com' });
    addOnlineUser({ user_id: 1, full_name: 'Alice Updated', email: 'a@example.com' });
    const users = useCollaborationStore.getState().onlineUsers;
    expect(users).toHaveLength(1);
    expect(users[0].full_name).toBe('Alice Updated');
  });

  it('removeOnlineUser filters by id', () => {
    const { addOnlineUser, removeOnlineUser } = useCollaborationStore.getState();
    addOnlineUser({ user_id: 1, full_name: 'Alice', email: 'a@example.com' });
    addOnlineUser({ user_id: 2, full_name: 'Bob', email: 'b@example.com' });
    removeOnlineUser(1);
    expect(useCollaborationStore.getState().onlineUsers).toHaveLength(1);
    expect(useCollaborationStore.getState().onlineUsers[0].user_id).toBe(2);
  });

  it('setCurrentDocument stores document id', () => {
    useCollaborationStore.getState().setCurrentDocument(42);
    expect(useCollaborationStore.getState().currentDocumentId).toBe(42);
  });

  it('setLockInfo updates lockInfo and lockedDocuments map', () => {
    const lock = { document_id: 5, locked_by_id: 1, locked_by_name: 'Alice' };
    useCollaborationStore.getState().setLockInfo(lock);
    const state = useCollaborationStore.getState();
    expect(state.lockInfo).toEqual(lock);
    expect(state.lockedDocuments.get(5)).toEqual(lock);
  });

  it('setLockInfo with null only updates lockInfo', () => {
    useCollaborationStore.getState().setLockInfo({ document_id: 5, locked_by_id: 1 });
    useCollaborationStore.getState().setLockInfo(null);
    expect(useCollaborationStore.getState().lockInfo).toBeNull();
    expect(useCollaborationStore.getState().lockedDocuments.get(5)).toBeDefined();
  });

  it('setWsState updates connection and sendMessage', () => {
    const send = (_msg: unknown) => {};
    useCollaborationStore.getState().setWsState({ isConnected: true, sendMessage: send as any });
    const state = useCollaborationStore.getState();
    expect(state.isConnected).toBe(true);
    expect(state.sendMessage).toBe(send);
  });

  it('reset restores initial state', () => {
    const { addOnlineUser, setCurrentDocument, setLockInfo } = useCollaborationStore.getState();
    addOnlineUser({ user_id: 1, full_name: 'Alice', email: 'a@example.com' });
    setCurrentDocument(99);
    setLockInfo({ document_id: 5, locked_by_id: 1 });
    useCollaborationStore.getState().reset();
    const s = useCollaborationStore.getState();
    expect(s.onlineUsers).toEqual([]);
    expect(s.currentDocumentId).toBeNull();
    expect(s.lockInfo).toBeNull();
    expect(s.lockedDocuments.size).toBe(0);
  });
});
