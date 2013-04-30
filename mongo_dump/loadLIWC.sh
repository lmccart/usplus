#!/bin/bash
mongorestore --db recon -c LIWC LIWC.bson
mongorestore --db recon -c LIWC_wildcards LIWC_wildcards.bson
echo "loaded LIWC libs into mongodb"