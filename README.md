# Turbo

> **Fastest** and **cheapest** ~~decentralized~~ residential Proxy network.

> [!NOTE]
> This project is still at _Proof of Concept_ stage

Here is a quick overview of the features:

### In progress

1. [x] Client connection quality analysis
2. [x] Crypto payment gateway
3. [x] Redis Auth (proxy logins + GB credits)
4. [ ] ~~Chrome Extension for client~~
5. [ ] Automatic Bitcoin rewards

### Global architecture

```mermaid
flowchart TD
    User[User]
    ProxyServer[Proxy Server]
    Redis[(Redis Database)]
    ClientNode[Client Node]
    NodeRunner[Node Runner]
    PaymentGateway[Crypto Payment Gateway]
    BitcoinNetwork[(Bitcoin Network)]
    TargetWebsite[Target Website / Internet]

    User --> |Sends Requests| ProxyServer
    User --> |Buys Credits| PaymentGateway

    ProxyServer --> |Uses for User Auth & Credits| Redis
    ProxyServer <--> |QUIC Messaging| ClientNode

    ClientNode --> |Processes Requests To| TargetWebsite
    NodeRunner --> |Operates| ClientNode

    PaymentGateway --> |Processes Payments| BitcoinNetwork
    PaymentGateway --> |Updates Credits In| Redis

    BitcoinNetwork --> |Sends Rewards in BTC| NodeRunner
```

## Monetization

Earn passive Bitcoin rewards for sharing your unused Internet bandwidth.

### Run a Client Node

Start earning by running the [latest release](https://github.com/L1shed/Turbo/releases) of the client node in background.

[//]: # (TODO: Add detailed connection instructions, help, visual tutorial.)

### Reward

Reward is `$1.00` per GB shared, that may seem low but the network is small so the handled bandwidth is high.

For example, a node shares 0.1 GB/hour of bandwidth.
At the current price rate we can expect $73.2/month per device if running 24/7.

The reward is paid in Bitcoin every day at 00:00 UTC (only if reward > $5 in BTC).

### Score calculation

The score (up to 100) is based on two factors:
- $L$: Latency, capped on a range from 10ms to 500ms
- $R$: Reliability

$$
S = w_L \cdot L + w_R \cdot R
$$

Where $w_L$: 60%, $w_R$: 40%

### Self-host a Server Node

Run server docker image and connect clients.

See clients stats at https://localhost:8080/stats


## System Design

See [Global Architecture](#global-architecture) for a high-level overview of the system.

### Traffic flow

```mermaid
sequenceDiagram
    participant SOCKS5_Client as SOCKS5 Client (User)
    participant Proxy_Server as Proxy Server
    participant Proxy_Client as Client Node
    participant Internet as Internet

    SOCKS5_Client->>Proxy_Server: 1. SOCKS5 CONNECT request
    Proxy_Server->>Proxy_Client: 2. Forward request via QUIC
    Proxy_Client->>Internet: 3. Process request & fetch data
    Internet-->>Proxy_Client: 4. Return response
    Proxy_Client-->>Proxy_Server: 5. Send data via QUIC
    Proxy_Server-->>SOCKS5_Client: 6. Send back to SOCKS5 Client
```

## Buy Bandwidth

Want to buy proxy access from our network for web-scraping?

Join our [Discord server](https://discord.gg/ZqdvQkSEc7) and create a ticket.


[//]: # (### Some links)

[//]: # ()
[//]: # (- [Discord]&#40;https://discord.gg/ZqdvQkSEc7&#41;)