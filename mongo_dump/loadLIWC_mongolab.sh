#!/bin/bash
mongorestore -h ds039057-a0-internal.mongolab.com:39057 -u sosolimited -p r3c0n12 --db recon -c LIWC LIWC.bson
mongorestore -h ds039057-a0-internal.mongolab.com:39057 -u sosolimited -p r3c0n12 --db recon -c LIWC_wildcards LIWC_wildcards.bson
echo "loaded LIWC libs into mongodb_mongolab"