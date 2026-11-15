<?php
declare(strict_types=1);

/**
 * Minimal pattern router. Patterns use {param} segments, e.g.
 *   GET /inbox/conversations/{id}/messages
 * Supports HEAD via GET and OPTIONS short-circuit.
 */
final class Router
{
    /** @var array<int, array{method:string,pattern:string,regex:string,params:array,handler:callable}> */
    private array $routes = [];
    private array $middleware = [];

    public function middleware(callable $mw): void
    {
        $this->middleware[] = $mw;
    }

    public function add(string $method, string $pattern, callable $handler): void
    {
        $params = [];
        $regex = preg_replace_callback('/\{(\w+)\}/', function ($m) use (&$params) {
            $params[] = $m[1];
            return '([A-Za-z0-9_\-\.%]+)';
        }, $pattern);
        $regex = '#^' . $regex . '$#';
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'regex' => $regex,
            'params' => $params,
            'handler' => $handler,
        ];
    }

    public function get(string $p, callable $h): void { $this->add('GET', $p, $h); }
    public function post(string $p, callable $h): void { $this->add('POST', $p, $h); }
    public function put(string $p, callable $h): void { $this->add('PUT', $p, $h); }
    public function patch(string $p, callable $h): void { $this->add('PATCH', $p, $h); }
    public function delete(string $p, callable $h): void { $this->add('DELETE', $p, $h); }

    public function dispatch(Request $req): void
    {
        $method = $req->method === 'HEAD' ? 'GET' : $req->method;

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method && !($method === 'OPTIONS' && in_array($route['method'], ['GET','POST','PUT','PATCH','DELETE'], true))) {
                continue;
            }
            if (!preg_match($route['regex'], $req->path, $m)) continue;

            array_shift($m);
            foreach ($route['params'] as $i => $name) {
                $req->params[$name] = urldecode($m[$i] ?? '');
            }

            foreach ($this->middleware as $mw) {
                $mw($req, $route);
            }
            ($route['handler'])($req);
            return;
        }

        Response::error('Route not found: ' . $req->method . ' ' . $req->path, 404);
    }
}
