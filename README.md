# P2P Energy Trading Sandbox

This is the reference implementation for the **Peer-to-Peer (P2P) Energy Trading Platform** using the **Beckn Protocol (v2.0.0)**. It serves as a unified sandbox demonstrating the interaction between Discoms, Consumers, and Prosumers.

## Overview
The sandbox operates as a **Monolithic Application** simulating both Buyer and Seller sides:
*   **BAP (Beckn Application Platform)**: Represents the Buyer (Consumer).
*   **BPP (Beckn Provider Platform)**: Represents the Seller (Prosumer).
*   **Sync API**: A simplified REST layer bridging synchronous client requests to the asynchronous Beckn network.

## Architecture
The system encapsulates the following components:
1.  **Sync API (`/api/*`)**: Entry point for client applications. Handles `/select`, `/init`, `/confirm` flows synchronously.
2.  **BAP Webhook (`/bap-webhook`)**: Receives async callbacks from the Beckn network.
3.  **BPP Webhook (`/webhook`)**: Handles incoming provider-side requests.
4.  **Services**:
    *   **CatalogStore**: Manages Energy Assets and Offers.
    *   **SettlementStore**: Tracks valid energy delivery and financial settlements.
    *   **LedgerClient**: Integrates with external DLT/Blockchain for settlement validation.

## Key Configuration
| Variable | Description | Default |
| :--- | :--- | :--- |
| `WHEELING_RATE` | Charge per kWh for grid usage | `1.50` |
| `ONIX_BAP_URL` | URL of the BAP Network Adapter | `http://localhost:8081` |
| `ONIX_BPP_URL` | URL of the BPP Network Adapter | `http://localhost:8082` |

## Docker image builds

### Local build

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t sandbox-2.0:local --load .
```

### Push to Docker Hub

This needs authorization to push to Docker Hub. You can use `docker login` to login to Docker Hub.

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t fidedocker/sandbox-2.0:latest --push .
```
