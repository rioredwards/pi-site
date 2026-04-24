## [ERR-20260306-001] python3_import_torch

**Logged**: 2026-03-06T08:07:46Z
**Priority**: low
**Status**: pending
**Area**: infra

### Summary
Local Python environment did not have `torch` installed during path inspection.

### Error
```text
ModuleNotFoundError: No module named 'torch'
```

### Context
- Command attempted: `python3 -c "import torch, torchvision; print(torch.hub.get_dir())"`
- Goal: confirm torch cache directory directly in the local runtime
- Environment: host Python outside container

### Suggested Fix
Inspect paths from inside the running service container, or install dependencies in a local virtual environment first.

### Metadata
- Reproducible: yes
- Related Files: main.py, requirements.txt

---

## [ERR-20260306-002] docker_compose_ps

**Logged**: 2026-03-06T08:07:46Z
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
Docker CLI could not reach Docker daemon while checking running services.

### Error
```text
Cannot connect to the Docker daemon at unix:///Users/rioredwards/.docker/run/docker.sock. Is the docker daemon running?
```

### Context
- Command attempted: `docker compose ps --services --status running`
- Goal: inspect live container filesystem for actual model files
- Environment: local machine with Docker daemon unavailable

### Suggested Fix
Start Docker Desktop or Docker daemon before running compose inspection commands.

### Metadata
- Reproducible: unknown
- Related Files: ../docker-compose.yml

---

## [ERR-20260306-003] pip_download_with_deps

**Logged**: 2026-03-06T08:07:46Z
**Priority**: low
**Status**: pending
**Area**: infra

### Summary
Downloading `opennsfw-standalone` with dependency resolution failed because Pillow source build metadata failed under Python 3.13.

### Error
```text
ERROR: Failed to build 'Pillow' when getting requirements to build wheel
KeyError: '__version__'
```

### Context
- Command attempted: `python3 -m pip download opennsfw-standalone==0.0.6 -d /tmp/opennsfw_inspect`
- Goal: inspect package contents to confirm model asset location
- Environment: host Python 3.13

### Suggested Fix
Use `--no-deps` for inspection-only wheel downloads: `python3 -m pip download --no-deps ...`.

### Metadata
- Reproducible: yes
- Related Files: requirements.txt

---
