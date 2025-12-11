# sandbox
Beckn Sandbox for Beckn v2.0.0 protocol specifications available at https://github.com/beckn/protocol-specifications-new

# Docker image builds

## Local build

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t sandbox-2.0:local --load .
```

## Push to Docker Hub

This needs authorization to push to Docker Hub. You can use `docker login` to login to Docker Hub.

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t fidedocker/sandbox-2.0:latest --push .
```
