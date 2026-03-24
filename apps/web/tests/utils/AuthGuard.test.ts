/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { enforceAuthStatus } from '../../src/utils/AuthGuard';

describe('AuthGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        // Use vi.stubGlobal to safely mock window.location
        vi.stubGlobal('location', {
            assign: vi.fn(),
            replace: vi.fn(),
            href: '/',
            pathname: '/'
        });
    });

    afterAll(() => {
        vi.unstubAllGlobals();
    });

    it('should NOT redirect to /notes/ if authenticated on public page (root)', () => {
        localStorage.setItem('session_token', 'valid-token');
        window.location.pathname = '/';

        enforceAuthStatus('public');

        expect(window.location.href).toBe('/');
    });

    it('should redirect to /notes/ if authenticated on signin page', () => {
        localStorage.setItem('session_token', 'valid-token');
        window.location.pathname = '/signin/';

        enforceAuthStatus('public');

        expect(window.location.href).toBe('/notes/');
    });

    it('should NOT redirect if authenticated but already on /notes/ (public mode)', () => {
        localStorage.setItem('session_token', 'valid-token');
        window.location.pathname = '/notes/';

        enforceAuthStatus('public');

        // href should stay '/' (initial state)
        expect(window.location.href).toBe('/');
    });

    it('should NOT redirect if NOT authenticated on public page (root)', () => {
        window.location.pathname = '/';

        enforceAuthStatus('public');

        expect(window.location.href).toBe('/');
    });

    it('should redirect to /signin/ if NOT authenticated on private page', () => {
        window.location.pathname = '/notes/';

        enforceAuthStatus('private');

        expect(window.location.href).toBe('/signin/');
    });

    it('should NOT redirect if NOT authenticated but already on /signin/ (private mode)', () => {
        window.location.pathname = '/signin/';

        enforceAuthStatus('private');

        expect(window.location.href).toBe('/');
    });

    it('should NOT redirect if authenticated on private page', () => {
        localStorage.setItem('session_token', 'valid-token');
        window.location.pathname = '/notes/';

        enforceAuthStatus('private');

        expect(window.location.href).toBe('/');
    });
});
