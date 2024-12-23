/**
 * MiddlewareManager class for handling URL-based middlewares.
 */
class MiddlewareManager {
    /**
     * Constructor for initializing the MiddlewareManager.
     */
    constructor() {
        this.middlewares = [];
        this.executedMiddlewares = new Map();
        this.detectNavigation();
    }

    /**
     * Detects navigation events and executes middlewares.
     */
    detectNavigation() {
        window.addEventListener('hashchange', () => {
            this.executeMiddlewares(window.location.href);
        });

        window.addEventListener('popstate', () => {
            this.executeMiddlewares(window.location.href);
        });

        // Execute middlewares on initial page load
        window.addEventListener('load', () => {
            this.executeMiddlewares(window.location.href);
        });
    }

    /**
     * Registers a middleware with a condition and handler.
     * @param {string|RegExp|function} condition - The condition for matching URLs.
     * @param {function} handler - The middleware handler function.
     */
    use(condition, handler) {
        this.middlewares.push({ condition, handler });
    }

    /**
     * Registers a middleware instance.
     * @param {object} middlewareInstance - The middleware instance.
     */
    useInstance(middlewareInstance) {
        this.middlewares.push(middlewareInstance);
    }

    /**
     * Executes matching middlewares for a given URL.
     * @param {string} url - The URL to match against middleware conditions.
     */
    async executeMiddlewares(url) {
        const cachedResult = this.executedMiddlewares.get(url);

        if (cachedResult !== undefined && cachedResult.length > 0) {
            return cachedResult;
        }

        const matchingMiddlewares = this.middlewares.filter(middleware => {
            if (middleware.condition) {
                return this.testCondition(middleware.condition, url);
            } else if (middleware.match) {
                return middleware.match(url);
            }
            return false;
        });


        const executionResult = [];

        for (const middleware of matchingMiddlewares) {
            try {
                if (middleware.handler) {
                    await middleware.handler(url);
                } else if (middleware.handle) {
                    await middleware.handle(url);
                }
                executionResult.push(true);
            } catch (error) {
                console.error(`Error executing middleware ${middleware.constructor.name}:`, error);
                executionResult.push(false);
            }
        }

        this.executedMiddlewares.set(url, executionResult);
        return executionResult;
    }
    /**
     * Tests a condition against a URL.
     * @param {string|RegExp|function} condition - The condition to test.
     * @param {string} url - The URL to test against the condition.
     * @returns {boolean} - True if the condition matches the URL, false otherwise.
     */
    testCondition(condition, url) {
        if (typeof condition === 'string') {
            // Exact URL match
            return url === condition;
        } else if (condition instanceof RegExp) {
            // Regular expression match
            return condition.test(url);
        } else if (typeof condition === 'function') {
            // Custom condition function
            return condition(url);
        }
        return false;
    }
}

module.exports = MiddlewareManager;