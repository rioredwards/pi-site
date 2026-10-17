#!/bin/bash
# Install root-owned at /usr/local/sbin/dogtown-containment. No package changes.
set -euo pipefail
[[ $EUID == 0 ]] || { echo 'Run as root' >&2; exit 1; }
rules() {
cat <<'NFT'
add table inet dogtown_containment
flush table inet dogtown_containment
table inet dogtown_containment {
  chain private_egress {
    ct state established,related ct direction reply accept
    ip daddr 100.100.100.100 meta l4proto { tcp, udp } th dport 53 accept
    ip6 daddr fd7a:115c:a1e0::53 meta l4proto { tcp, udp } th dport 53 accept
    udp dport { 67, 123, 41641 } accept
    ip daddr { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 100.64.0.0/10, 169.254.0.0/16 } reject
    ip6 daddr { fc00::/7, fe80::/10 } reject
  }
  chain output {
    type filter hook output priority -10; policy accept;
    oifname "lo" accept
    oifname "br-*" accept
    oifname "docker0" accept
    jump private_egress
  }
  chain forward {
    type filter hook forward priority -10; policy accept;
    iifname "br-*" oifname "br-*" accept
    iifname "docker0" oifname "docker0" accept
    iifname "br-*" jump private_egress
    iifname "docker0" jump private_egress
    ct state established,related accept
    oifname "br-*" reject
    oifname "docker0" reject
  }
  chain input {
    type filter hook input priority -10; policy drop;
    iifname "lo" accept
    ct state established,related accept
    iifname "tailscale0" tcp dport 22 accept
    udp dport { 68, 41641 } accept
    meta l4proto { icmp, ipv6-icmp } accept
  }
}
NFT
}
case "${1:-}" in
  apply)
    rules | nft --check -f -
    systemd-run --quiet --unit=dogtown-firewall-rollback --on-active=5m \
      /usr/sbin/nft delete table inet dogtown_containment
    rules | nft -f -
    echo 'Rollback armed for 5 minutes. Verify fresh SSH, DNS, tunnel and denied Mac access, then confirm.'
    ;;
  load) rules | nft -f - ;;
  confirm)
    cat > /etc/systemd/system/dogtown-containment.service <<'UNIT'
[Unit]
Description=DogTown host and container network containment
After=network-pre.target
Before=network.target docker.service tailscaled.service
Wants=network-pre.target
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/dogtown-containment load
RemainAfterExit=yes
[Install]
WantedBy=multi-user.target
UNIT
    systemctl daemon-reload
    systemctl enable dogtown-containment.service
    systemctl stop dogtown-firewall-rollback.timer
    echo 'Containment persists at boot; rollback timer canceled.'
    ;;
  rollback)
    systemctl disable dogtown-containment.service || true
    nft delete table inet dogtown_containment
    ;;
  *) echo 'Usage: dogtown-containment apply|confirm|load|rollback' >&2; exit 2 ;;
esac
