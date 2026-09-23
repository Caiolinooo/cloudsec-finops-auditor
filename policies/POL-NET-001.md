# [POL-NET-001] No 0.0.0.0/0 on administrative ports

- **Severity:** HIGH
- **Framework:** CIS AWS 5.2 · SOC 2 CC6.6
- **Domain:** Network / Security groups

## Clause

Security groups MUST NOT allow inbound `0.0.0.0/0` or `::/0` on SSH (22),
RDP (3389), or database ports. Admin access requires a bastion, SSM Session
Manager, or VPN with source restriction.

This clause is retrieved when an architecture describes open management
endpoints alongside IAM or data-store findings.

## Remediation

1. Replace world-open SSH with SSM Session Manager
2. Restrict remaining bastion SG to corporate egress CIDRs
3. Enable VPC Flow Logs for rejected admin probes
