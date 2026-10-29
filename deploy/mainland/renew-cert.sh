#!/bin/sh
set -eu
umask 077
export NO_ARI=1 ACME_USE_IPV4_REQUESTS=1
exec /root/.acme.sh-design-dna/acme.sh --cron --home /root/.acme.sh-design-dna
