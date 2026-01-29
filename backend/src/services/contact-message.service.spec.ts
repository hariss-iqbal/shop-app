import { ContactMessageService } from './contact-message.service';
import { ContactMessageRepository } from '../repositories/contact-message.repository';
import { ContactMessage } from '../entities/contact-message.entity';

/**
 * ContactMessage Service Tests
 * Verifies message CRUD, read status toggling, and unread count
 */

function createMockMessage(overrides: Partial<ContactMessage> = {}): ContactMessage {
  return {
    id: 'msg-001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: null,
    subject: null,
    message: 'Hello, I have a question about a phone.',
    is_read: false,
    created_at: '2026-01-28T10:00:00Z',
    ...overrides
  };
}

function createMockRepository(): ContactMessageRepository {
  const messages: ContactMessage[] = [
    createMockMessage({ id: 'msg-001', is_read: false }),
    createMockMessage({ id: 'msg-002', name: 'Jane Doe', email: 'jane@example.com', is_read: true }),
    createMockMessage({ id: 'msg-003', name: 'Bob Smith', email: 'bob@example.com', is_read: false })
  ];

  return {
    findAll: async (options?: { isRead?: boolean }) => {
      if (options?.isRead !== undefined) {
        return messages.filter(m => m.is_read === options.isRead);
      }
      return [...messages];
    },
    findById: async (id: string) => messages.find(m => m.id === id) || null,
    create: async (insert: { name: string; email: string; phone?: string | null; subject?: string | null; message: string; is_read?: boolean }) => ({
      id: 'msg-new',
      name: insert.name,
      email: insert.email,
      phone: insert.phone ?? null,
      subject: insert.subject ?? null,
      message: insert.message,
      is_read: insert.is_read ?? false,
      created_at: new Date().toISOString()
    }),
    update: async (id: string, update: Partial<ContactMessage>) => {
      const existing = messages.find(m => m.id === id);
      if (!existing) throw new Error('Not found');
      return { ...existing, ...update };
    },
    delete: async () => {},
    count: async (isRead?: boolean) => {
      if (isRead !== undefined) {
        return messages.filter(m => m.is_read === isRead).length;
      }
      return messages.length;
    },
    getUnreadCount: async () => messages.filter(m => !m.is_read).length,
    markAsRead: async (id: string) => {
      const existing = messages.find(m => m.id === id);
      if (!existing) throw new Error('Not found');
      return { ...existing, is_read: true };
    },
    markAsUnread: async (id: string) => {
      const existing = messages.find(m => m.id === id);
      if (!existing) throw new Error('Not found');
      return { ...existing, is_read: false };
    },
    markAllAsRead: async () => {}
  } as unknown as ContactMessageRepository;
}

async function runTests(): Promise<void> {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string): void {
    if (condition) {
      console.log(`  PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  FAIL: ${testName}`);
      failed++;
    }
  }

  console.log('ContactMessageService Tests');
  console.log('===========================\n');

  // findAll Tests
  console.log('findAll:');
  {
    const repo = createMockRepository();
    const service = new ContactMessageService(repo);

    const result = await service.findAll();
    assert(result.data.length === 3, 'returns all messages');
    assert(result.total === 3, 'returns correct total count');
    assert(result.unreadCount === 2, 'returns correct unread count');
  }

  // findAll with filter
  console.log('\nfindAll with filter:');
  {
    const repo = createMockRepository();
    const service = new ContactMessageService(repo);

    const unreadResult = await service.findAll({ isRead: false });
    assert(unreadResult.data.length === 2, 'filters unread messages');

    const readResult = await service.findAll({ isRead: true });
    assert(readResult.data.length === 1, 'filters read messages');
  }

  // findById Tests
  console.log('\nfindById:');
  {
    const repo = createMockRepository();
    const service = new ContactMessageService(repo);

    const found = await service.findById('msg-001');
    assert(found !== null, 'finds existing message');
    assert(found!.id === 'msg-001', 'returns correct message');
    assert(found!.isRead === false, 'maps is_read to isRead correctly');

    const notFound = await service.findById('nonexistent');
    assert(notFound === null, 'returns null for nonexistent message');
  }

  // Response DTO mapping
  console.log('\nResponse DTO mapping:');
  {
    const repo = createMockRepository();
    const service = new ContactMessageService(repo);

    const result = await service.findById('msg-001');
    assert(result!.messagePreview === 'Hello, I have a question about a phone.', 'short message has full preview');

    const longMessageRepo = {
      ...createMockRepository(),
      findById: async () => createMockMessage({
        message: 'A'.repeat(60)
      })
    } as unknown as ContactMessageRepository;
    const longService = new ContactMessageService(longMessageRepo);
    const longResult = await longService.findById('msg-001');
    assert(longResult!.messagePreview.length === 53, 'long message is truncated to 50 chars + ellipsis');
    assert(longResult!.messagePreview.endsWith('...'), 'long message preview ends with ellipsis');
  }

  // markAsRead Tests
  console.log('\nmarkAsRead:');
  {
    const repo = createMockRepository();
    const service = new ContactMessageService(repo);

    const result = await service.markAsRead('msg-001');
    assert(result.isRead === true, 'marks message as read');
    assert(result.id === 'msg-001', 'returns correct message');
  }

  // markAsUnread Tests
  console.log('\nmarkAsUnread:');
  {
    const repo = createMockRepository();
    const service = new ContactMessageService(repo);

    const result = await service.markAsUnread('msg-002');
    assert(result.isRead === false, 'marks message as unread');
  }

  // markAsRead non-existent
  console.log('\nmarkAsRead non-existent:');
  {
    const repo = createMockRepository();
    const service = new ContactMessageService(repo);

    try {
      await service.markAsRead('nonexistent');
      assert(false, 'should throw error for non-existent message');
    } catch (e: unknown) {
      assert((e as Error).message.includes('not found'), 'throws not found error');
    }
  }

  // create Tests
  console.log('\ncreate:');
  {
    const repo = createMockRepository();
    const service = new ContactMessageService(repo);

    const result = await service.create({
      name: 'New User',
      email: 'new@example.com',
      message: 'New message content'
    });
    assert(result.name === 'New User', 'creates with correct name');
    assert(result.email === 'new@example.com', 'creates with correct email');
    assert(result.isRead === false, 'new message defaults to unread');
  }

  // getUnreadCount Tests
  console.log('\ngetUnreadCount:');
  {
    const repo = createMockRepository();
    const service = new ContactMessageService(repo);

    const count = await service.getUnreadCount();
    assert(count === 2, 'returns correct unread count');
  }

  // Silent reject (honeypot)
  console.log('\ncreateSilentReject:');
  {
    const repo = createMockRepository();
    const service = new ContactMessageService(repo);

    const result = service.createSilentReject({
      name: 'Bot',
      email: 'bot@spam.com',
      message: 'Buy now!'
    });
    assert(result.name === 'Bot', 'returns fake response with correct name');
    assert(result.isRead === false, 'fake response shows as unread');
    assert(typeof result.id === 'string' && result.id.length > 0, 'fake response has an id');
  }

  // delete Tests
  console.log('\ndelete:');
  {
    const repo = createMockRepository();
    const service = new ContactMessageService(repo);

    try {
      await service.delete('msg-001');
      assert(true, 'deletes existing message without error');
    } catch {
      assert(false, 'should not throw for existing message');
    }

    try {
      await service.delete('nonexistent');
      assert(false, 'should throw for non-existent message');
    } catch (e: unknown) {
      assert((e as Error).message.includes('not found'), 'throws not found error for deletion');
    }
  }

  console.log(`\n===========================`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
