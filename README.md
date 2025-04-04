# Turbo

The solution for high-bandwidth residential proxies.

Earn passive Bitcoin rewards for sharing your unused Internet traffic.

## In Progress

This project is still at _Proof of Concept_ stage

1. [x] Client connection quality analysis
2. [ ] Crypto payment gateway
3. [ ] ~~Switching from WebSocket to gRPC~~
4. [ ] Chrome Extension for client
5. [ ] Automatic Bitcoin rewards

## Self-host

Run server, clients docker images

See stats at https://localhost:8080/stats

## Traffic flow

```mermaid
sequenceDiagram
    participant SOCKS5_Client as SOCKS5 Client
    participant Proxy_Server as Proxy Server
    participant Proxy_Client as Proxy Client
    participant Internet as Internet

    SOCKS5_Client->>Proxy_Server: 1. SOCKS5 CONNECT request
    Proxy_Server->>Proxy_Client: 2. Forward request via WebSocket
    Proxy_Client->>Internet: 3. Process request & fetch data
    Internet-->>Proxy_Client: 4. Return response
    Proxy_Client-->>Proxy_Server: 5. Send response via WebSocket
    Proxy_Server-->>SOCKS5_Client: 6. Send response to SOCKS5 Client
```

## Monetization

### Run a Node

Reward is `$0.01` per GB shared, that may seem low but the network is small so the handled bandwidth is high.

For example, a node shares 1 GB/s of bandwidth.
At the current price rate we can expect $0.01\$/sec = 432\$/month$ per device if running 24/7.

## Buy Bandwidth

Want to buy traffic from our network for web-scraping?

visit our website

[//]: # (Monetization is based on _connections_, requests that client performed successfully.)

## HWID Bans

 



