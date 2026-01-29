import { TestBed } from '@angular/core/testing';
import { InputSanitizationService } from './input-sanitization.service';

describe('InputSanitizationService', () => {
  let service: InputSanitizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InputSanitizationService]
    });
    service = TestBed.inject(InputSanitizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sanitize', () => {
    it('should return empty string unchanged', () => {
      expect(service.sanitize('')).toBe('');
    });

    it('should return null/undefined unchanged', () => {
      expect(service.sanitize(null as unknown as string)).toBeNull();
      expect(service.sanitize(undefined as unknown as string)).toBeUndefined();
    });

    it('should preserve plain text', () => {
      expect(service.sanitize('Hello World')).toBe('Hello World');
      expect(service.sanitize('Normal user input')).toBe('Normal user input');
    });

    it('should trim whitespace', () => {
      expect(service.sanitize('  hello  ')).toBe('hello');
      expect(service.sanitize('\t\ntest\n\t')).toBe('test');
    });

    describe('script tag removal', () => {
      it('should remove simple script tags', () => {
        expect(service.sanitize('<script>alert("xss")</script>')).toBe('');
      });

      it('should remove script tags with attributes', () => {
        expect(service.sanitize('<script type="text/javascript">alert("xss")</script>')).toBe('');
      });

      it('should remove script tags with src attribute', () => {
        expect(service.sanitize('<script src="evil.js"></script>')).toBe('');
      });

      it('should remove multiple script tags', () => {
        expect(service.sanitize('<script>a</script>text<script>b</script>')).toBe('text');
      });

      it('should handle script tags with newlines', () => {
        expect(service.sanitize('<script>\nalert("xss")\n</script>')).toBe('');
      });

      it('should handle case-insensitive script tags', () => {
        expect(service.sanitize('<SCRIPT>alert("xss")</SCRIPT>')).toBe('');
        expect(service.sanitize('<Script>alert("xss")</Script>')).toBe('');
      });

      it('should preserve text around script tags', () => {
        expect(service.sanitize('before<script>evil</script>after')).toBe('beforeafter');
      });
    });

    describe('HTML tag removal', () => {
      it('should remove simple HTML tags', () => {
        expect(service.sanitize('<div>content</div>')).toBe('content');
        expect(service.sanitize('<p>paragraph</p>')).toBe('paragraph');
      });

      it('should remove self-closing tags', () => {
        expect(service.sanitize('line<br/>break')).toBe('linebreak');
        expect(service.sanitize('line<br />break')).toBe('linebreak');
      });

      it('should remove nested tags', () => {
        expect(service.sanitize('<div><span>nested</span></div>')).toBe('nested');
      });

      it('should remove tags with attributes', () => {
        expect(service.sanitize('<div class="test" id="main">content</div>')).toBe('content');
      });

      it('should remove dangerous tags', () => {
        expect(service.sanitize('<iframe src="evil.html"></iframe>')).toBe('');
        expect(service.sanitize('<object data="evil.swf"></object>')).toBe('');
        expect(service.sanitize('<embed src="evil.swf">')).toBe('');
      });

      it('should remove img tags with onerror', () => {
        expect(service.sanitize('<img src="x" onerror="alert(1)">')).toBe('');
      });

      it('should remove anchor tags', () => {
        expect(service.sanitize('<a href="javascript:alert(1)">click</a>')).toBe('click');
      });
    });

    describe('javascript protocol removal', () => {
      it('should remove javascript: protocol', () => {
        expect(service.sanitize('javascript:alert(1)')).toBe('alert(1)');
      });

      it('should remove javascript: with spaces', () => {
        expect(service.sanitize('javascript : alert(1)')).toBe('alert(1)');
      });

      it('should handle case-insensitive javascript:', () => {
        expect(service.sanitize('JAVASCRIPT:alert(1)')).toBe('alert(1)');
        expect(service.sanitize('JavaScript:alert(1)')).toBe('alert(1)');
      });
    });

    describe('event handler removal', () => {
      it('should remove onclick handlers', () => {
        expect(service.sanitize('onclick="alert(1)"')).toBe('');
      });

      it('should remove onerror handlers', () => {
        expect(service.sanitize('onerror="evil()"')).toBe('');
      });

      it('should remove onload handlers', () => {
        expect(service.sanitize('onload="init()"')).toBe('');
      });

      it('should remove onmouseover handlers', () => {
        expect(service.sanitize('onmouseover="hover()"')).toBe('');
      });

      it('should handle handlers with single quotes', () => {
        expect(service.sanitize("onclick='alert(1)'")).toBe('');
      });

      it('should handle handlers with spaces', () => {
        expect(service.sanitize('onclick = "alert(1)"')).toBe('');
      });
    });

    describe('complex XSS payloads', () => {
      it('should handle SVG-based XSS', () => {
        const payload = '<svg onload="alert(1)">';
        expect(service.sanitize(payload)).not.toContain('svg');
        expect(service.sanitize(payload)).not.toContain('onload');
      });

      it('should handle img tag XSS', () => {
        const payload = '<img src=x onerror=alert(1)>';
        expect(service.sanitize(payload)).not.toContain('img');
      });

      it('should handle mixed content', () => {
        const payload = 'Hello <b>world</b> <script>evil()</script>';
        const result = service.sanitize(payload);
        expect(result).toBe('Hello world');
        expect(result).not.toContain('script');
      });

      it('should handle data URI schemes', () => {
        const payload = '<a href="data:text/html,<script>alert(1)</script>">click</a>';
        const result = service.sanitize(payload);
        expect(result).not.toContain('data:');
      });
    });

    describe('real-world inputs', () => {
      it('should preserve phone numbers', () => {
        expect(service.sanitize('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
      });

      it('should preserve email addresses', () => {
        expect(service.sanitize('user@example.com')).toBe('user@example.com');
      });

      it('should handle mathematical expressions (angle brackets treated as HTML)', () => {
        // Note: < and > are treated as HTML tag markers by the sanitizer
        // This is expected behavior for security - legitimate math expressions
        // should use HTML entities (&lt; &gt;) in user input if needed
        const result = service.sanitize('Price: $100 < $200');
        // The < creates an incomplete tag that gets removed, leaving the text intact
        expect(result).toBe('Price: $100 < $200');
      });

      it('should preserve special characters', () => {
        expect(service.sanitize('It\'s a "test" & more')).toBe('It\'s a "test" & more');
      });

      it('should preserve Unicode characters', () => {
        expect(service.sanitize('日本語テスト')).toBe('日本語テスト');
        expect(service.sanitize('Café résumé')).toBe('Café résumé');
      });

      it('should preserve newlines in plain text', () => {
        const input = 'Line 1\nLine 2\nLine 3';
        expect(service.sanitize(input)).toBe(input);
      });
    });
  });

  describe('sanitizeOrNull', () => {
    it('should return null for null input', () => {
      expect(service.sanitizeOrNull(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(service.sanitizeOrNull(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(service.sanitizeOrNull('')).toBeNull();
    });

    it('should return null for whitespace-only string', () => {
      expect(service.sanitizeOrNull('   ')).toBeNull();
      expect(service.sanitizeOrNull('\t\n')).toBeNull();
    });

    it('should return null when sanitized content is empty', () => {
      expect(service.sanitizeOrNull('<script>evil</script>')).toBeNull();
      expect(service.sanitizeOrNull('<div></div>')).toBeNull();
    });

    it('should return sanitized string for valid content', () => {
      expect(service.sanitizeOrNull('Hello')).toBe('Hello');
      expect(service.sanitizeOrNull('  Hello  ')).toBe('Hello');
    });

    it('should return sanitized string with content preserved', () => {
      expect(service.sanitizeOrNull('<b>Bold</b>')).toBe('Bold');
      expect(service.sanitizeOrNull('before<script>x</script>after')).toBe('beforeafter');
    });
  });

  describe('sanitizeFormData', () => {
    it('should sanitize all string values in object', () => {
      const data = {
        name: '  John <script>alert(1)</script>  ',
        email: 'john@example.com',
        message: '<b>Hello</b> World'
      };

      const result = service.sanitizeFormData(data);

      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(result.message).toBe('Hello World');
    });

    it('should preserve non-string values', () => {
      const data = {
        name: 'John',
        age: 30,
        active: true,
        balance: 100.50,
        created: new Date('2024-01-01'),
        nullValue: null,
        undefinedValue: undefined
      };

      const result = service.sanitizeFormData(data);

      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
      expect(result.balance).toBe(100.50);
      expect(result.created).toEqual(new Date('2024-01-01'));
      expect(result.nullValue).toBeNull();
      expect(result.undefinedValue).toBeUndefined();
    });

    it('should handle empty object', () => {
      const data = {};
      const result = service.sanitizeFormData(data);
      expect(result).toEqual({});
    });

    it('should not modify original object', () => {
      const original = { name: '<b>Test</b>' };
      const result = service.sanitizeFormData(original);

      expect(original.name).toBe('<b>Test</b>');
      expect(result.name).toBe('Test');
    });

    it('should handle nested objects at top level only', () => {
      const data = {
        name: '<b>John</b>',
        nested: {
          value: '<script>evil</script>'
        }
      };

      const result = service.sanitizeFormData(data);

      expect(result.name).toBe('John');
      // Nested objects are not deeply sanitized
      expect(result.nested).toEqual({ value: '<script>evil</script>' });
    });
  });

  describe('containsDangerousContent', () => {
    it('should return false for null/undefined', () => {
      expect(service.containsDangerousContent(null as unknown as string)).toBe(false);
      expect(service.containsDangerousContent(undefined as unknown as string)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(service.containsDangerousContent('')).toBe(false);
    });

    it('should return false for plain text', () => {
      expect(service.containsDangerousContent('Hello World')).toBe(false);
      expect(service.containsDangerousContent('Normal user input')).toBe(false);
    });

    it('should return true for script tags', () => {
      expect(service.containsDangerousContent('<script>alert(1)</script>')).toBe(true);
      expect(service.containsDangerousContent('<script src="evil.js">')).toBe(true);
      expect(service.containsDangerousContent('</script>')).toBe(true);
    });

    it('should return true for javascript: protocol', () => {
      expect(service.containsDangerousContent('javascript:alert(1)')).toBe(true);
      expect(service.containsDangerousContent('JAVASCRIPT:void(0)')).toBe(true);
    });

    it('should return true for event handlers', () => {
      expect(service.containsDangerousContent('onclick=')).toBe(true);
      expect(service.containsDangerousContent('onerror=')).toBe(true);
      expect(service.containsDangerousContent('onload=')).toBe(true);
      expect(service.containsDangerousContent('onmouseover=')).toBe(true);
    });

    it('should return true for iframe tags', () => {
      expect(service.containsDangerousContent('<iframe src="evil.html">')).toBe(true);
      expect(service.containsDangerousContent('<IFRAME>')).toBe(true);
    });

    it('should return true for object tags', () => {
      expect(service.containsDangerousContent('<object data="evil.swf">')).toBe(true);
    });

    it('should return true for embed tags', () => {
      expect(service.containsDangerousContent('<embed src="evil.swf">')).toBe(true);
    });

    it('should return false for safe HTML', () => {
      expect(service.containsDangerousContent('<b>Bold</b>')).toBe(false);
      expect(service.containsDangerousContent('<div class="test">Content</div>')).toBe(false);
      expect(service.containsDangerousContent('<a href="https://example.com">Link</a>')).toBe(false);
    });

    it('should return false for escaped content', () => {
      expect(service.containsDangerousContent('&lt;script&gt;')).toBe(false);
      expect(service.containsDangerousContent('&#60;script&#62;')).toBe(false);
    });

    it('should handle case-insensitive detection', () => {
      expect(service.containsDangerousContent('<SCRIPT>')).toBe(true);
      expect(service.containsDangerousContent('<Script>')).toBe(true);
      expect(service.containsDangerousContent('<IFrame>')).toBe(true);
    });
  });
});
